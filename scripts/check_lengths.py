import os

files = [
    'ja/heart/deep.txt',
    'ja/sistine-chapel/deep.txt', 
    'zh/heart/deep.txt',
    'zh/sistine-chapel/deep.txt'
]

base = 'D:/wondersofrome/final_cleaned_content'

for f in files:
    path = os.path.join(base, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
        print(f'{f}: {len(content)} chars')
