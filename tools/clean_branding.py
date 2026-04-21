import os
import re
from pathlib import Path

SOURCE_DIR = Path("D:/wondersofrome/tts_scripts-20260415T211514Z-3-001/tts_scripts")
OUTPUT_DIR = Path("D:/wondersofrome/cleaned_production_content")

CLEANUP_RULES = [
    # Intros
    (r"Hey, I'm Rick Steves\.", "Welcome to your guided audio tour."),
    (r"I'm Rick Steves\.", "I am your guide."),
    (r"Hello, I'm Rick Steves\.", "Hello, welcome to this tour."),
    (r"Rick Steves here\.", ""),
    
    # Outros
    (r"This tour was excerpted from the Rick Steves Rome Guidebook.*", "Thank you for joining this tour of Rome."),
    (r"Remember, this tour was.*Rick Steves.*", ""),
    (r"For more free audio tours.*ricksteves\.com.*", ""),
    (r"Visit our website at ricksteves\.com\.", ""),
    (r"ricksteves\.com", "wondersofrome.com"),
    
    # Credits
    (r"This tour was produced by Cedar House Audio Productions\.", ""),
    (r"Thanks to Gene Openshaw.*", ""),
    (r"Thanks to Lisa.*", ""),
    
    # General mentions
    (r"while Rick sets the scene", "as we set the scene"),
    (r"Rick Steves", "your guide"),
    (r"Rick", "your guide"),
]

def clean_text(text):
    for pattern, replacement in CLEANUP_RULES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    # Clean up double spaces and empty lines
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    return text.strip()

def process_all():
    print("🚀 Starting Production Content Cleanup (Branding Removal)")
    
    processed = 0
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".txt"):
                file_path = Path(root) / file
                rel_path = file_path.relative_to(SOURCE_DIR)
                out_path = OUTPUT_DIR / rel_path
                
                out_path.parent.mkdir(parents=True, exist_ok=True)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    cleaned = clean_text(content)
                    
                    with open(out_path, 'w', encoding='utf-8') as f:
                        f.write(cleaned)
                    
                    processed += 1
                    if processed % 10 == 0:
                        print(f"✅ Processed {processed} files...")
                except Exception as e:
                    print(f"❌ Error processing {file_path}: {e}")

    print(f"\n✨ DONE! Processed {processed} files into {OUTPUT_DIR}")

if __name__ == "__main__":
    process_all()
