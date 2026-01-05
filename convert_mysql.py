#!/usr/bin/env python3
"""Convert MySQL dump to PostgreSQL compatible INSERT statements"""

import re
import sys

def convert_mysql_to_postgres(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove MySQL-specific statements
    lines = content.split('\n')
    output_lines = []
    
    skip_patterns = [
        'SET NAMES',
        'SET FOREIGN_KEY_CHECKS',
        'SET SQL_MODE',
        'SET TIME_ZONE',
        'DROP TABLE',
        'CREATE TABLE',
        'ENGINE=',
        'LOCK TABLES',
        'UNLOCK TABLES',
        '/*!',
        'KEY ',
        'CONSTRAINT',
        'PRIMARY KEY',
    ]
    
    in_create_table = False
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('--') or stripped.startswith('/*'):
            continue
            
        # Skip CREATE TABLE blocks
        if 'CREATE TABLE' in stripped:
            in_create_table = True
            continue
        if in_create_table:
            if stripped.endswith(';'):
                in_create_table = False
            continue
        
        # Skip other patterns
        skip = False
        for pattern in skip_patterns:
            if pattern in stripped.upper():
                skip = True
                break
        if skip:
            continue
        
        # Skip BEGIN/COMMIT
        if stripped.upper() in ['BEGIN;', 'COMMIT;', 'BEGIN', 'COMMIT']:
            continue
        
        # Process INSERT statements
        if stripped.upper().startswith('INSERT INTO'):
            # Remove backticks
            line = line.replace('`', '')
            output_lines.append(line)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"Converted {len(output_lines)} statements to {output_file}")

if __name__ == '__main__':
    convert_mysql_to_postgres('test.sql', 'postgres_data.sql')
