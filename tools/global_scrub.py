import os
import re
from pathlib import Path

SOURCE_DIR = Path("D:/wondersofrome/cleaned_production_content")
OUTPUT_DIR = Path("D:/wondersofrome/cleaned_production_content_v2")

# Multilingual branding patterns
GLOBAL_RULES = [
    # Name in various scripts found in analysis
    r"Rick\s+Steves?", r"RickSteve", r"ريك\s+ستيفز", r"里克·史蒂夫斯", 
    r"リック・スティーブス", r"Рик\s+Стивс", r"릭\s+스티브스",
    
    # Common URLs
    r"ricksteves\.com", r"www\.ricksteves\.com",
    
    # Generic replacements
    (r"Gene\s+Openshaw", ""), (r"Francesca\s+Caruso", ""),
    (r"Cedar\s+House\s+Audio\s+Productions", ""),
]

def multi_clean(text):
    # First, handle the known English phrases specifically
    text = re.sub(r"Hey, I'm Rick Steves\.", "Welcome to your guided audio tour.", text, flags=re.IGNORECASE)
    
    # Then scrub the name in any script
    for pattern in GLOBAL_RULES:
        if isinstance(pattern, tuple):
            text = re.sub(pattern[0], pattern[1], text, flags=re.IGNORECASE)
        else:
            # Replace the name with "your guide" or nothing depending on context
            text = re.sub(pattern, "your guide", text, flags=re.IGNORECASE)
            
    # Cleanup generic artifacts
    text = re.sub(r"your guide\.com", "wondersofrome.com", text) # Fix URL breakages
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def process_v2():
    print("🌍 Starting Global Multilingual Branding Scrub...")
    processed = 0
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".txt"):
                file_path = Path(root) / file
                rel_path = file_path.relative_to(SOURCE_DIR)
                out_path = OUTPUT_DIR / rel_path
                out_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                cleaned = multi_clean(content)
                
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned)
                processed += 1
    print(f"✅ Scrubbed {processed} files into {OUTPUT_DIR}")

if __name__ == "__main__":
    process_v2()
