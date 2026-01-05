#!/usr/bin/env python3
"""
MySQL to JSON converter for blog data migration
Converts Navicat MySQL export to JSON format for import via API
Usage: python3 convert_mysql_to_json.py input.sql output.json
"""

import re
import json
import sys

def escape_content(s):
    """Unescape MySQL escapes"""
    if s is None:
        return None
    s = s.replace("\\'", "'")
    s = s.replace("\\n", "\n")
    s = s.replace("\\r", "\r")
    s = s.replace("\\t", "\t")
    s = s.replace("\\\\", "\\")
    return s

def parse_mysql_values(values_str):
    """Parse MySQL VALUES string into a list of values"""
    values = []
    current = ""
    in_quote = False
    i = 0
    
    while i < len(values_str):
        char = values_str[i]
        if char == '\\' and i + 1 < len(values_str):
            current += char + values_str[i + 1]
            i += 2
            continue
        if char == "'" and not (i > 0 and values_str[i-1] == '\\'):
            in_quote = not in_quote
            current += char
        elif char == ',' and not in_quote:
            values.append(current.strip())
            current = ""
        else:
            current += char
        i += 1
    
    if current.strip():
        values.append(current.strip())
    return values

def strip_quotes(s):
    """Remove surrounding quotes from a string"""
    if s == 'NULL' or s is None:
        return None
    if s.startswith("'") and s.endswith("'"):
        return s[1:-1]
    return s

def convert_mysql_to_json(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data = {
        "categories": [],
        "tags": [],
        "blogs": [],
        "blog_tags": [],
        "directories": [],
        "documents": [],
        "projects": [],
        "friend_links": [],
        "texts": []
    }
    
    # Parse categories
    cat_section = re.search(r"-- Records of category.*?BEGIN;(.*?)COMMIT;", content, re.DOTALL)
    if cat_section:
        cat_pattern = r"INSERT INTO `category` \(`id`, `create_time`, `intro`, `logo`, `name`\) VALUES \((.+?)\);"
        for match in re.finditer(cat_pattern, cat_section.group(1), re.DOTALL):
            values = parse_mysql_values(match.group(1))
            if len(values) >= 5:
                data["categories"].append({
                    "id": int(values[0]),
                    "name": escape_content(strip_quotes(values[4])),
                    "intro": escape_content(strip_quotes(values[2])),
                    "logo": escape_content(strip_quotes(values[3]))
                })
    
    # Parse tags
    tag_pattern = r"INSERT INTO `tag` \(`id`, `name`\) VALUES \((\d+), '([^']*)'\);"
    for match in re.finditer(tag_pattern, content):
        data["tags"].append({
            "id": int(match.group(1)),
            "name": escape_content(match.group(2))
        })
    
    # Parse blogs
    blog_pattern = r"INSERT INTO `blog` \(`id`, `alias_string`, `author`, `content`, `create_time`, `date_string`, `html`, `thumbnail`, `title`, `category_id`, `view_count`\) VALUES \((.+?)\);\s*(?=INSERT INTO `blog`|COMMIT)"
    for match in re.finditer(blog_pattern, content, re.DOTALL):
        values = parse_mysql_values(match.group(1))
        if len(values) >= 11:
            alias = strip_quotes(values[1]) or ''
            data["blogs"].append({
                "id": int(values[0]),
                "title": escape_content(strip_quotes(values[8])),
                "slug": alias if alias else f"blog-{values[0]}",
                "author": escape_content(strip_quotes(values[2])),
                "content": escape_content(strip_quotes(values[3])),
                "html": escape_content(strip_quotes(values[6])) or "",
                "thumbnail": escape_content(strip_quotes(values[7])),
                "category_id": int(values[9]) if values[9] != 'NULL' else None,
                "view_count": int(values[10]) if values[10] != 'NULL' else 0,
                "is_published": True,
                "created_at": strip_quotes(values[4])
            })
    
    # Parse blog_tags
    blog_tags_pattern = r"INSERT INTO `blog_tags` \(`blog_id`, `tag_id`\) VALUES \((\d+), (\d+)\);"
    for match in re.finditer(blog_tags_pattern, content):
        data["blog_tags"].append({
            "blog_id": int(match.group(1)),
            "tag_id": int(match.group(2))
        })
    
    # Parse directories
    dir_pattern = r"INSERT INTO `directory` \(`id`, `create_date`, `introduce`, `name`, `parent_id`\) VALUES \((\d+), '([^']*)', (NULL|'[^']*'), '([^']*)', (NULL|\d+)\);"
    for match in re.finditer(dir_pattern, content):
        intro = match.group(3)
        data["directories"].append({
            "id": int(match.group(1)),
            "name": escape_content(match.group(4)),
            "intro": escape_content(intro.strip("'")) if intro != 'NULL' else None,
            "parent_id": int(match.group(5)) if match.group(5) != 'NULL' else None,
            "created_at": match.group(2)
        })
    
    # Parse documents (markdown_file)
    doc_section = re.search(r"-- Records of markdown_file.*?BEGIN;(.*?)COMMIT;", content, re.DOTALL)
    if doc_section:
        doc_pattern = r"INSERT INTO `markdown_file` \(`id`, `content`, `create_date`, `filename`, `name`, `directory_id`\) VALUES \((.+?)\);\s*(?=INSERT INTO|$)"
        for match in re.finditer(doc_pattern, doc_section.group(1), re.DOTALL):
            values = parse_mysql_values(match.group(1))
            if len(values) >= 6:
                data["documents"].append({
                    "id": int(values[0]),
                    "name": escape_content(strip_quotes(values[4])),
                    "filename": escape_content(strip_quotes(values[3])),
                    "content": escape_content(strip_quotes(values[1])),
                    "directory_id": int(values[5]) if values[5] != 'NULL' else None,
                    "created_at": strip_quotes(values[2])
                })
    
    # Parse projects
    project_pattern = r"INSERT INTO `project` \(`id`, `description`, `download_url`, `github`, `logo`, `name`, `preview_url`\) VALUES \((\d+), '([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)'\);"
    for match in re.finditer(project_pattern, content):
        data["projects"].append({
            "id": int(match.group(1)),
            "name": escape_content(match.group(6)),
            "description": escape_content(match.group(2)) or None,
            "logo": escape_content(match.group(5)) or None,
            "github_url": escape_content(match.group(4)) or None,
            "preview_url": escape_content(match.group(7)) or None,
            "download_url": escape_content(match.group(3)) or None
        })
    
    # Parse friend_links
    friend_pattern = r"INSERT INTO `friend_link` \(`id`, `create_date`, `email`, `intro`, `logo`, `name`, `state`, `url`\) VALUES \((\d+), '([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)', (\d+), '([^']*)'\);"
    for match in re.finditer(friend_pattern, content):
        data["friend_links"].append({
            "id": int(match.group(1)),
            "name": escape_content(match.group(6)),
            "url": escape_content(match.group(8)),
            "logo": escape_content(match.group(5)) or None,
            "intro": escape_content(match.group(4)) or None,
            "email": escape_content(match.group(3)) or None,
            "status": int(match.group(7)),
            "created_at": match.group(2)
        })
    
    # Parse texts
    text_section = re.search(r"-- Records of text.*?BEGIN;(.*?)COMMIT;", content, re.DOTALL)
    if text_section:
        text_pattern = r"INSERT INTO `text` \(`id`, `context`, `intro`, `is_encryption_text`, `name`, `origin_password`, `view_password`, `create_date`, `update_date`\) VALUES \((.+?)\);"
        for match in re.finditer(text_pattern, text_section.group(1), re.DOTALL):
            values = parse_mysql_values(match.group(1))
            if len(values) >= 9:
                data["texts"].append({
                    "id": int(values[0]),
                    "name": escape_content(strip_quotes(values[4])),
                    "intro": escape_content(strip_quotes(values[2])),
                    "content": escape_content(strip_quotes(values[1])),
                    "is_encrypted": values[3] != 'NULL',
                    "view_password": escape_content(strip_quotes(values[6])) or None,
                    "created_at": strip_quotes(values[7]),
                    "updated_at": strip_quotes(values[8])
                })
    
    # Sort directories: parent_id NULL first
    data["directories"].sort(key=lambda x: (x["parent_id"] is not None, x["id"]))
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Converted to {output_file}:")
    for key, items in data.items():
        print(f"  - {key}: {len(items)}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 convert_mysql_to_json.py input.sql output.json")
        sys.exit(1)
    convert_mysql_to_json(sys.argv[1], sys.argv[2])
