import glob, os

def main():
    directory = r"D:\Synapse\Screenshot synapse"
    files = sorted(glob.glob(os.path.join(directory, "*.jpg")) + glob.glob(os.path.join(directory, "*.png")))
    html = "<html><body>\n"
    for f in files:
        if "showcase_images" in f: continue
        basename = os.path.basename(f)
        html += f"<h3>{basename}</h3><img src='{basename}' width='400'><br>\n"
    html += "</body></html>"
    
    with open(os.path.join(directory, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)

if __name__ == "__main__":
    main()
