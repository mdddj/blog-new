---
title: "UE5(C++) 使用 Rust 编写插件并给虚幻调用"
slug: "ue5-cpp-rust-plugin"
summary: "这篇文章整理 UE5 C++ 插件调用 Rust 动态库的完整路径：Rust 侧 cdylib 与 C ABI、cbindgen 头文件、UE ThirdParty 目录、Build.cs 链接/加载配置、C++ 封装、跨平台运行时依赖，以及可复用的 ue-rust-ffi-plugin skill。"
tags:
  - UE5
  - Unreal Engine
  - C++
  - Rust
  - FFI
  - Skills
---

# UE5(C++) 使用 Rust 编写插件并给虚幻调用

最近在做 UE5 插件时，我遇到一个很实际的问题：有些逻辑用 C++ 写当然可以，但 Rust 生态里已经有更成熟的库，尤其是文本处理、模型推理、网络请求、数据解析这类能力。如果为了接入 UE 全部重写一遍，成本不低，也没有必要。

所以我选择了一条更直接的路：把 Rust 编译成动态库，通过 C ABI 暴露一层很窄的接口，再由 UE5 C++ 插件去调用。

这篇文章不是讲“Rust 比 C++ 好”这种泛泛的话题，而是整理一条能真正跑通的工程路径：Rust 怎么导出函数，UE 插件怎么放第三方库，`Build.cs` 怎么配置，字符串和内存怎么处理，Windows/macOS 的动态库加载又有哪些坑。

最后我也把这套经验沉淀成了一个可复用的 skill：

https://github.com/mdddj/skills/tree/main/skills/ue-rust-ffi-plugin

以后再做 UE5 + Rust FFI 插件时，可以直接让 AI 按这个 skill 的约束来生成或检查代码。

## 整体思路

UE 调 Rust，核心不是让 UE 理解 Rust，而是让 Rust 对外表现得像一个普通的 C 动态库。

推荐的边界是：

1. Rust 编译成 `cdylib`。
2. Rust 只暴露 `extern "C"` 函数。
3. 参数只使用基础类型、指针、长度、回调、状态码。
4. 复杂 Rust 类型不要跨 FFI 边界。
5. UE C++ 再包一层类，把裸指针和释放函数藏起来。

这样做的好处是边界清晰。UE 侧业务代码不需要知道 Rust 的 `String`、`Vec`、生命周期，也不需要直接操作 Rust 分配的内存。

一个典型目录可以长这样：

```text
Plugins/MyPlugin/
  MyPlugin.uplugin
  Source/
    MyPlugin/
      MyPlugin.Build.cs
      Public/
        MyRustBridge.h
      Private/
        MyRustBridge.cpp
  ThirdParty/
    UeMarkdownBridge/
      include/
        ue_markdown_bridge.h
      bin/
        Win64/
          ue_markdown_bridge.dll
      lib/
        Win64/
          ue_markdown_bridge.dll.lib
        Mac/
          libue_markdown_bridge.dylib
```

这里有一个原则：不要让 UE 在运行时依赖 Cargo 的 `target/release` 目录。Rust 的产物应该复制到插件自己的 `ThirdParty` 或 `Binaries` 目录里，这样编辑器、打包和分发时路径才稳定。

## Rust 侧：编译成 cdylib

Rust 工程的 `Cargo.toml` 里需要明确指定 `cdylib`：

```toml
[package]
name = "ue_markdown_bridge"
version = "0.1.0"
edition = "2021"

[lib]
name = "ue_markdown_bridge"
crate-type = ["cdylib"]

[dependencies]
mdka = "1.2"
reqwest = { version = "0.12", default-features = false, features = ["blocking", "rustls-tls"] }

[build-dependencies]
cbindgen = "0.27"
```

这里不要用普通的 `dylib`。`dylib` 更偏 Rust 自己的动态链接模型，会暴露很多 Rust 相关细节；给 C/C++ 调用时，`cdylib` 才是更合适的默认选择。

然后暴露一个 C ABI 函数。下面的例子是把 URL 对应的 HTML 转成 Markdown：

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

fn into_ffi_string(value: String) -> *mut c_char {
    let sanitized = value.replace('\0', "");
    CString::new(sanitized)
        .unwrap_or_else(|_| CString::new("").expect("empty CString"))
        .into_raw()
}

fn error_string(message: impl AsRef<str>) -> *mut c_char {
    into_ffi_string(format!("ERROR: {}", message.as_ref()))
}

#[no_mangle]
pub extern "C" fn ue_markdown_from_url(url: *const c_char) -> *mut c_char {
    let result = std::panic::catch_unwind(|| {
        if url.is_null() {
            return Err("url pointer was null".to_owned());
        }

        let url = unsafe { CStr::from_ptr(url) }
            .to_str()
            .map_err(|err| format!("url was not valid UTF-8: {err}"))?;

        let html = reqwest::blocking::get(url)
            .and_then(|response| response.error_for_status())
            .and_then(|response| response.text())
            .map_err(|err| format!("request failed: {err}"))?;

        Ok(mdka::from_html(&html))
    });

    match result {
        Ok(Ok(markdown)) => into_ffi_string(markdown),
        Ok(Err(message)) => error_string(message),
        Err(_) => error_string("panic in Rust FFI boundary"),
    }
}

#[no_mangle]
pub extern "C" fn ue_rust_free_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }

    unsafe {
        drop(CString::from_raw(ptr));
    }
}
```

这段代码里有几个点很重要：

- `#[no_mangle]` 保证导出的符号名不会被 Rust 改写。
- `extern "C"` 保证函数使用 C ABI。
- FFI 边界上用 `catch_unwind`，不要让 Rust panic 跨到 C++。
- Rust 返回的字符串必须配套释放函数，例如 `ue_rust_free_string`。
- UE 侧拿到字符串后要立即复制，然后调用释放函数。

如果你使用 Rust 2024 edition，`#[no_mangle]` 需要写成 `#[unsafe(no_mangle)]`。

## 用 cbindgen 生成头文件

UE C++ 需要包含一个 C 兼容头文件。手写也可以，但实际项目里更推荐用 `cbindgen` 生成。

`cbindgen.toml` 可以这样配置：

```toml
language = "C"
cpp_compat = true
include_guard = "UE_MARKDOWN_BRIDGE_H"
usize_is_size_t = true
```

再加一个 `build.rs`，每次构建时自动生成头文件：

```rust
use std::{env, fs, path::PathBuf};

fn main() {
    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=cbindgen.toml");

    let crate_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is set");
    let include_dir = PathBuf::from(&crate_dir).join("include");
    fs::create_dir_all(&include_dir).expect("create include directory");

    let config = cbindgen::Config::from_file("cbindgen.toml").unwrap_or_default();
    cbindgen::Builder::new()
        .with_crate(crate_dir)
        .with_config(config)
        .generate()
        .expect("generate C bindings")
        .write_to_file(include_dir.join("ue_markdown_bridge.h"));
}
```

生成后，把 `include/ue_markdown_bridge.h` 复制到 UE 插件的 `ThirdParty/<LibName>/include` 目录下。

## UE 侧：Build.cs 配置

UE 插件最容易出问题的地方通常不是 C++ 调用本身，而是动态库路径、链接方式和打包时的 RuntimeDependencies。

如果是 Windows，可以链接 Rust 生成的 import library，并 delay-load DLL：

```csharp
using System.IO;
using UnrealBuildTool;

public class MyPlugin : ModuleRules
{
    public MyPlugin(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new[]
        {
            "Core",
            "Projects"
        });

        PrivateDependencyModuleNames.AddRange(new[]
        {
            "CoreUObject",
            "Engine"
        });

        string PluginRoot = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", ".."));
        string ThirdParty = Path.Combine(PluginRoot, "ThirdParty", "UeMarkdownBridge");

        PublicSystemIncludePaths.Add(Path.Combine(ThirdParty, "include"));

        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string DllName = "ue_markdown_bridge.dll";
            string DllPath = Path.Combine(ThirdParty, "bin", "Win64", DllName);
            string ImportLibPath = Path.Combine(ThirdParty, "lib", "Win64", "ue_markdown_bridge.dll.lib");

            PublicAdditionalLibraries.Add(ImportLibPath);
            PublicDelayLoadDLLs.Add(DllName);
            RuntimeDependencies.Add("$(TargetOutputDir)/" + DllName, DllPath);
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            string DylibName = "libue_markdown_bridge.dylib";
            string DylibPath = Path.Combine(ThirdParty, "lib", "Mac", DylibName);

            PublicAdditionalLibraries.Add(DylibPath);
            RuntimeDependencies.Add("$(TargetOutputDir)/" + DylibName, DylibPath);
        }
    }
}
```

这里要注意：`RuntimeDependencies.Add` 只是在告诉 UE 打包/部署时需要带上这些文件，它不会替你构建 Rust，也不一定会替你把开发期编辑器需要的 DLL/dylib 放到正确位置。

本地开发时，我更倾向于写一个脚本，把 Rust 产物明确复制到插件目录：

```text
ThirdParty/UeMarkdownBridge/include
ThirdParty/UeMarkdownBridge/bin/Win64
ThirdParty/UeMarkdownBridge/lib/Win64
ThirdParty/UeMarkdownBridge/lib/Mac
Binaries/Win64 或 Binaries/Mac
```

路径稳定之后，很多“编辑器能编译但运行找不到库”的问题会少很多。

## C++ 包一层，不要让业务碰裸指针

UE 侧可以直接包含 cbindgen 生成的头文件，然后调用 Rust 函数：

```cpp
// Public/MyRustBridge.h
#pragma once

#include "CoreMinimal.h"

class MYPLUGIN_API FMyRustBridge
{
public:
    static FString MarkdownFromUrl(const FString& Url);
};
```

```cpp
// Private/MyRustBridge.cpp
#include "MyRustBridge.h"

THIRD_PARTY_INCLUDES_START
#include "ue_markdown_bridge.h"
THIRD_PARTY_INCLUDES_END

FString FMyRustBridge::MarkdownFromUrl(const FString& Url)
{
    char* RawResult = ue_markdown_from_url(TCHAR_TO_UTF8(*Url));
    if (RawResult == nullptr)
    {
        return FString();
    }

    const FString Result = UTF8_TO_TCHAR(RawResult);
    ue_rust_free_string(RawResult);
    return Result;
}
```

这个封装看起来很薄，但价值很大：

- 业务层只拿 `FString`，不直接处理 `char*`。
- Rust 分配的内存由 Rust 释放。
- UTF-8 和 `FString` 的转换集中在一处。
- 后续要换成手动加载或函数指针，也不影响外部调用方。

## 什么时候需要手动加载动态库

在简单场景下，直接链接 import library 或 dylib 就够了。但如果你的 Rust 动态库背后还有复杂依赖，例如 TensorFlow Lite、LiteRT、Protobuf、Abseil、GPU delegate 之类的大型原生栈，macOS 上硬链接很容易在编辑器启动阶段遇到加载顺序、依赖路径或符号冲突问题。

这种情况下，可以改成手动加载：

```cpp
void* LibraryHandle = FPlatformProcess::GetDllHandle(*LibraryPath);

auto MarkdownFromUrlFn = reinterpret_cast<char* (*)(const char*)>(
    FPlatformProcess::GetDllExport(LibraryHandle, TEXT("ue_markdown_from_url")));

auto FreeStringFn = reinterpret_cast<void (*)(char*)>(
    FPlatformProcess::GetDllExport(LibraryHandle, TEXT("ue_rust_free_string")));
```

手动加载时，`Build.cs` 不一定需要 `PublicAdditionalLibraries`，但仍然需要保证 DLL/dylib 被复制和打包。一般可以把运行时库放到：

```text
Plugins/MyPlugin/Binaries/Win64
Plugins/MyPlugin/Binaries/Mac
```

然后在模块 `StartupModule` 中加载，在 `ShutdownModule` 中释放。

这里不要混用两种方式：同一个平台上，要么直接链接并调用符号，要么手动 `GetDllExport` 后通过函数指针调用。两套模式混在一起，会让问题变得很难排查。

## Windows 和 macOS 的差异

Windows 下推荐使用 MSVC target：

```powershell
rustup target add x86_64-pc-windows-msvc
cargo build --release --target x86_64-pc-windows-msvc
```

通常会得到：

```text
ue_markdown_bridge.dll
ue_markdown_bridge.dll.lib
```

UE 的 `Build.cs` 里链接 `.dll.lib`，运行时带上 `.dll`。如果 DLL 还有其他依赖，也要一起复制到 `Binaries/Win64` 或打包输出目录。

macOS 下要特别注意架构：

```bash
cargo build --release --target aarch64-apple-darwin
```

Apple Silicon 通常是 `aarch64-apple-darwin`，Intel Mac 则是 `x86_64-apple-darwin`。如果要做通用库，可以用 `lipo` 合并：

```bash
lipo -create \
  -output target/release/libue_markdown_bridge.dylib \
  target/aarch64-apple-darwin/release/libue_markdown_bridge.dylib \
  target/x86_64-apple-darwin/release/libue_markdown_bridge.dylib
```

排查 macOS 动态库问题时，我一般会先看这几个命令：

```bash
file libue_markdown_bridge.dylib
otool -L libue_markdown_bridge.dylib
otool -l libue_markdown_bridge.dylib
nm -gU libue_markdown_bridge.dylib | grep ue_markdown
```

`file` 看架构，`otool -L` 看依赖，`otool -l` 看 rpath，`nm` 看符号有没有正确导出。

## 回调和异步任务要更谨慎

如果 Rust 只是同步返回一个字符串，问题还比较简单。如果 Rust 要做流式输出，例如 LLM token-by-token 回调 UE，那就要额外注意线程和生命周期。

原则是：

- Rust 回调线程不要直接碰 UObject。
- 回调参数用 `const char* + len`，UE 侧立即按长度复制。
- UE 侧再用 `AsyncTask(ENamedThreads::GameThread, ...)` 回到游戏线程广播 Blueprint delegate。
- 异步节点要保证生命周期，不能让 `UBlueprintAsyncActionBase` 提前被 GC。
- PIE 停止或 World teardown 时，要取消 Rust 侧任务并释放 handle。

这类问题一旦没处理好，常见表现就是：蓝图偶尔没输出、编辑器退出时卡住、停止 PIE 后回调还在跑、或者第一次 token 是空白导致误判没有返回。

如果你做的是 AI 推理、语音识别、网络流式响应，这部分一定要提前设计，不要等崩溃后再补。

## 我把这套流程整理成了 skill

这次整理过程中，我把 UE5 + Rust FFI 插件开发里容易踩坑的部分沉淀成了一个 skill：

https://github.com/mdddj/skills/tree/main/skills/ue-rust-ffi-plugin

它主要覆盖这些内容：

- UE 插件目录结构检查。
- Rust `cdylib`、`extern "C"`、`cbindgen` 头文件生成。
- Windows DLL/import library 链接。
- macOS dylib 加载、rpath、架构检查。
- `Build.cs` 中 `PublicAdditionalLibraries`、`PublicDelayLoadDLLs`、`RuntimeDependencies` 的使用。
- `FPlatformProcess::GetDllHandle` 和 `GetDllExport` 手动加载模式。
- UTF-8 与 `FString` 转换。
- Rust-owned memory 的释放规则。
- Rust 流式回调到 UE Blueprint async action 的封装。

使用时可以直接让 AI 按这个 skill 来做检查，例如：

```text
使用 ue-rust-ffi-plugin skill，检查我的 UE5 插件是否正确调用 Rust cdylib。
重点看 Build.cs、ThirdParty 目录、macOS dylib 加载、Windows delay-load，以及 Rust FFI 内存释放。
```

也可以让它按现有插件结构补代码：

```text
使用 ue-rust-ffi-plugin skill，把这个 Rust crate 接入到 UE5 C++ 插件。
目标平台是 Win64 和 Mac，Rust 产物放到 ThirdParty，UE 侧封装成一个 Blueprint 可调用函数。
```

## 总结

UE5 调 Rust 并不复杂，但它不是“把 Rust 函数直接给 C++ 调一下”这么简单。真正需要认真处理的是 ABI 边界、内存归属、动态库路径、平台加载差异和异步回调生命周期。

我的建议是：先把 FFI 边界做窄，只暴露稳定的 C 接口；再把所有裸指针封装在 UE 模块内部；最后用平台工具验证动态库和导出符号。这样项目越往后走，问题越可控。

如果只是做一个 demo，能调通就行。但如果要做成真正可维护的 UE 插件，这些工程细节最好一开始就定下来。
