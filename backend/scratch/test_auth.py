from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_auth():
    password = "mysecurepassword"
    print("Hashing password...")
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    
    print("Verifying password...")
    match = pwd_context.verify(password, hashed)
    print(f"Match: {match}")
    
    if match:
        print("[PASS] Hashing and verification work perfectly!")
    else:
        print("[FAIL] Verification failed!")

if __name__ == "__main__":
    test_auth()
