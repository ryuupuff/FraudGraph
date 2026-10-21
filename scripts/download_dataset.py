#!/usr/bin/env python3
"""
scripts/download_dataset.py

Automated acquisition script for the official Elliptic++ Transactions Dataset.
Downloads the raw dataset files from the official Google Drive repository
hosted by the authors (Elmougy & Liu, Georgia Tech / git-disl).

Target files:
- data/raw/txs_classes.csv   (203,769 transaction ground-truth labels)
- data/raw/txs_edgelist.csv  (234,355 directed transaction-to-transaction payment edges)
- data/raw/txs_features.csv  (203,769 transactions x 184 columns: 182 graph/blockchain features)
"""

import os
import sys
import re
import urllib.request
import urllib.parse
import http.cookiejar
from typing import Dict

# Official Google Drive file IDs from git-disl/EllipticPlusPlus repository:
# https://drive.google.com/drive/folders/1MRPXz79Lu_JGLlJ21MDfML44dKN9R08l
FILES: Dict[str, str] = {
    "txs_classes.csv": "1DiBxn8TXdbJqoSw58pYUeaqO3oOKhuQO",
    "txs_edgelist.csv": "1Q2yG_CIDvfdGP-fKVPSw979EYgQukjz5",
    "txs_features.csv": "19q09IFhfkOOBOXvn_dKhWjILJtjCcsjc",
}

DEFAULT_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")


def download_gdrive_file(file_id: str, destination_path: str, description: str) -> bool:
    """Download a file from Google Drive, handling direct downloads and virus-scan warning pages."""
    print(f"\n[+] Downloading {description} ({os.path.basename(destination_path)})...")
    
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    
    initial_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    req = urllib.request.Request(initial_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    
    try:
        with opener.open(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            
            # Direct binary or CSV stream
            if "text/html" not in content_type:
                return _stream_to_file(resp, destination_path)
            
            # Virus scan warning page for files > 100MB
            html = resp.read().decode("utf-8", errors="ignore")
            
            # Extract form action and input parameters
            form_match = re.search(r'<form[^>]*action="([^"]+)"', html)
            action = form_match.group(1) if form_match else "https://drive.usercontent.google.com/download"
            inputs = dict(re.findall(r'<input[^>]*name="([^"]+)"[^>]*value="([^"]*)"', html))
            
            if not inputs:
                # Fallback to confirm link
                m = re.search(r'href="(/uc\?export=download[^"]+)"', html)
                if m:
                    download_url = "https://drive.google.com" + m.group(1).replace("&amp;", "&")
                else:
                    print(f"[-] Error: Could not parse confirmation link for file ID {file_id}.")
                    return False
            else:
                download_url = f"{action}?{urllib.parse.urlencode(inputs)}"
            
            req_confirm = urllib.request.Request(download_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with opener.open(req_confirm) as resp_confirm:
                return _stream_to_file(resp_confirm, destination_path)
                
    except Exception as exc:
        print(f"[-] Network or write error during download of {description}: {exc}")
        return False


def _stream_to_file(response, destination_path: str, chunk_size: int = 1024 * 1024) -> bool:
    """Stream chunks from HTTP response to disk with progress output."""
    total_downloaded = 0
    with open(destination_path, "wb") as out_f:
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            out_f.write(chunk)
            total_downloaded += len(chunk)
            mb = total_downloaded / (1024 * 1024)
            sys.stdout.write(f"\r    -> Transferred: {mb:.1f} MB")
            sys.stdout.flush()
    print(f"\n[OK] Saved to: {destination_path} ({total_downloaded:,} bytes)")
    return True


def main():
    output_dir = DEFAULT_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)
    print(f"FraudGraph: Elliptic++ Dataset Downloader")
    print(f"Destination: {output_dir}")
    
    all_success = True
    for filename, file_id in FILES.items():
        dest = os.path.join(output_dir, filename)
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            print(f"[i] File already exists: {filename} ({os.path.getsize(dest):,} bytes). Skipping.")
            continue
        success = download_gdrive_file(file_id, dest, filename)
        if not success:
            all_success = False
            print(f"[-] Failed to download {filename}.")
            
    if all_success:
        print("\n[SUCCESS] All Elliptic++ transaction files downloaded to data/raw/.")
    else:
        print("\n[WARNING] Some files failed to download. Please verify network or manual instructions in docs/DATASET.md.")


if __name__ == "__main__":
    main()
