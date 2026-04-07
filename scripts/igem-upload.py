import os
from pathlib import Path

try:
    from uploads.session import Session
except ImportError:  # pragma: no cover
    Session = None

try:
    from igem_uploads import upload_dir as legacy_upload_dir
except ImportError:  # pragma: no cover
    legacy_upload_dir = None

if __name__ == "__main__":
    project_dir = Path(__file__).resolve().parents[1]
    dist_dir = project_dir / "dist"

    username = os.environ.get("IGEM_UPLOAD_USER")
    password = os.environ.get("IGEM_UPLOAD_PASSWORD")
    team = os.environ.get("IGEM_TEAM", "3rd-team")
    wiki = os.environ.get("IGEM_WIKI", "0")

    if not username or not password:
        raise SystemExit("Set IGEM_UPLOAD_USER and IGEM_UPLOAD_PASSWORD")

    # upload dist and dist/_astro
    print(f"Uploading {dist_dir} to iGEM CDN for team {team}")

    if Session is not None:
        client = Session(team=team, wiki=wiki)
        client.login(username=username, password=password)
        client.upload_dir(path=str(dist_dir), optimize=True)
    elif legacy_upload_dir is not None:
        legacy_upload_dir(
            path=str(dist_dir),
            username=username,
            password=password,
            team=team,
            wiki=wiki,
            optimize=True,
        )
    else:
        raise SystemExit("Missing igem upload package. Install from requirements.txt")

    print("Upload complete")
