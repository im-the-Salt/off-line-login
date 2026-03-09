import time
from subprocess import run
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firestore (with error handling for repeated init)
def init_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate("log-in-terminal-firebase-adminsdk-fbsvc-deef819b42.json")
        firebase_admin.initialize_app(cred)

init_firebase()
db = firestore.client()

while True:
    try:
        docs = db.collection("print_jobs").where("printed", "==", False).order_by("timestamp").limit(1).stream()
        found = False

        for doc in docs:
            found = True
            doc_id = doc.id
            data = doc.to_dict()
            account = data.get("account", "unknown")
            session_type = data.get("sessionType")

            # Count printed jobs and hidden achievements
            all_printed = db.collection("print_jobs").where("printed", "==", True).stream()
            total = 0
            hidden = 0
            for d in all_printed:
                total += 1
                if d.to_dict().get("sessionType") != "登入失敗":
                    hidden += 1

            if session_type == "登入失敗":
                print(f"[NORMAL ENDING] {account}")
                run(["python", "print_text.py", account, data.get("ip", ""), session_type])
            else:
                hidden += 1
                total += 1
                percent = round((hidden / total) * 100)
                print(f"[HIDDEN ENDING] {account} — No. {hidden}, approx. {percent}% of all users")
                run(["python", "print_test.py", account, str(percent)])

            db.collection("print_jobs").document(doc_id).update({
                "printed": True,
                "printed_at": firestore.SERVER_TIMESTAMP
            })

        if not found:
            print("[WAITING] No new print jobs found.")
        time.sleep(3)

    except Exception as e:
        print(f"[ERROR] Failed to check print jobs: {e}")
        try:
            init_firebase()
            db = firestore.client()
            print("[INFO] Firebase connection reinitialized.")
        except Exception as init_err:
            print(f"[ERROR] Firebase init failed: {init_err}")
        time.sleep(5)
