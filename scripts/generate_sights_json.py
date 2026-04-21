#!/usr/bin/env python3
"""
Generate sights.json with full R2 URLs and metadata
"""

import json
import os
from pathlib import Path

# R2 Configuration
CDN_BASE_URL = "https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev"
AUDIO_DIR = r"D:\wondersofrome\generated_audio_production"

# Attractions data
ATTRACTIONS = [
    {
        "id": "colosseum",
        "name": "Colosseum",
        "name_it": "Colosseo",
        "pack": "essential",
        "lat": 41.8902,
        "lng": 12.4922,
        "category": "ancient",
        "description": "Rome's iconic amphitheatre where gladiators fought and emperors entertained the city.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg"
    },
    {
        "id": "forum",
        "name": "Roman Forum",
        "name_it": "Foro Romano",
        "pack": "essential",
        "lat": 41.8925,
        "lng": 12.4853,
        "category": "ancient",
        "description": "The political and social heart of ancient Rome.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Roman_Forum_2019.jpg"
    },
    {
        "id": "heart",
        "name": "Heart of Rome",
        "name_it": "Cuore di Roma",
        "pack": "essential",
        "lat": 41.9,
        "lng": 12.48,
        "category": "piazza",
        "description": "The vibrant center of Rome with fountains, piazzas, and historic streets.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/7/70/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg"
    },
    {
        "id": "jewish-ghetto",
        "name": "Jewish Ghetto",
        "name_it": "Ghetto Ebraico",
        "pack": "essential",
        "lat": 41.8917,
        "lng": 12.4778,
        "category": "other",
        "description": "Historic Jewish quarter with rich cultural heritage and traditional cuisine.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Rome_Jewish_Ghetto.jpg/1280px-Rome_Jewish_Ghetto.jpg"
    },
    {
        "id": "ostia-antica",
        "name": "Ostia Antica",
        "name_it": "Ostia Antica",
        "pack": "full",
        "lat": 41.7556,
        "lng": 12.2925,
        "category": "ancient",
        "description": "Ancient Roman port city with remarkably preserved ruins.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ostia_Antica_-_Decumanus_Maximus.jpg/1280px-Ostia_Antica_-_Decumanus_Maximus.jpg"
    },
    {
        "id": "pantheon",
        "name": "Pantheon",
        "name_it": "Pantheon",
        "pack": "essential",
        "lat": 41.8986,
        "lng": 12.4769,
        "category": "ancient",
        "description": "A masterpiece of Roman engineering with a perfect dome and open oculus.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/9/97/Pantheon_Rome_2022.jpg"
    },
    {
        "id": "sistine-chapel",
        "name": "Sistine Chapel",
        "name_it": "Cappella Sistina",
        "pack": "essential",
        "lat": 41.9029,
        "lng": 12.4545,
        "category": "religious",
        "description": "Michelangelo's masterpiece ceiling in the heart of the Vatican.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sistine_Chapel_ceiling_01.jpg/1280px-Sistine_Chapel_ceiling_01.jpg"
    },
    {
        "id": "st-peters-basilica",
        "name": "St. Peter's Basilica",
        "name_it": "Basilica di San Pietro",
        "pack": "essential",
        "lat": 41.9022,
        "lng": 12.4539,
        "category": "religious",
        "description": "The heart of Catholicism and a showcase of Renaissance art.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg"
    },
    {
        "id": "trastevere",
        "name": "Trastevere",
        "name_it": "Trastevere",
        "pack": "essential",
        "lat": 41.8897,
        "lng": 12.4708,
        "category": "other",
        "description": "A charming neighborhood of cobbled lanes, small piazzas, and lively evenings.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Rome_Trastevere.jpg"
    },
    {
        "id": "vatican-museums",
        "name": "Vatican Museums",
        "name_it": "Musei Vaticani",
        "pack": "full",
        "lat": 41.9065,
        "lng": 12.4536,
        "category": "museum",
        "description": "A vast museum complex packed with classical sculptures, galleries, and masterpieces.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/0/04/Vatican_Museums_Courtyard.jpg"
    },
    {
        "id": "vatican-pinacoteca",
        "name": "Vatican Pinacoteca",
        "name_it": "Pinacoteca Vaticana",
        "pack": "full",
        "lat": 41.9055,
        "lng": 12.4525,
        "category": "museum",
        "description": "Vatican's art gallery featuring paintings from medieval to modern times.",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Vatican_Museums_-_Pinacoteca.jpg/1280px-Vatican_Museums_-_Pinacoteca.jpg"
    }
]

LANGUAGES = ["en", "ar", "de", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "zh"]

def get_audio_metadata(lang, attraction_id):
    """Get audio file metadata"""
    audio_path = Path(AUDIO_DIR) / lang / attraction_id / "deep.mp3"
    
    if audio_path.exists():
        size = audio_path.stat().st_size
        # Estimate duration from file size (rough estimate: 128kbps MP3)
        duration = int(size / (128 * 1024 / 8))
        return {
            "url": f"{CDN_BASE_URL}/{lang}/{attraction_id}/deep.mp3",
            "duration": duration,
            "size": size
        }
    else:
        # Return placeholder if file doesn't exist
        return {
            "url": f"{CDN_BASE_URL}/{lang}/{attraction_id}/deep.mp3",
            "duration": 600,
            "size": 5000000
        }

def generate_sights_json():
    """Generate complete sights.json"""
    
    sights = []
    
    for attraction in ATTRACTIONS:
        sight = {
            "id": attraction["id"],
            "name": attraction["name"],
            "name_it": attraction["name_it"],
            "pack": attraction["pack"],
            "lat": attraction["lat"],
            "lng": attraction["lng"],
            "radius": 20,
            "category": attraction["category"],
            "has_tips": True,
            "thumbnail": attraction["thumbnail"],
            "description": attraction["description"],
            "audioFiles": {}
        }
        
        # Add audio files for all languages
        for lang in LANGUAGES:
            sight["audioFiles"][lang] = {
                "deep": get_audio_metadata(lang, attraction["id"])
            }
        
        sights.append(sight)
    
    # Write to file
    output_path = Path(__file__).parent.parent / "wondersofrome_app" / "src" / "data" / "sights.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sights, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated sights.json with {len(sights)} attractions")
    print(f"📁 Output: {output_path}")
    print(f"🌐 CDN: {CDN_BASE_URL}")
    print(f"🗣️  Languages: {len(LANGUAGES)}")

if __name__ == "__main__":
    generate_sights_json()
