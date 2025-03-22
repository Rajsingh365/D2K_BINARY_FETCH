from app.db.database import SessionLocal, engine
from app.db.models import Base
from app.core.sample_data import create_sample_data


def setup():
    """Initialize the database with sample data."""
    # Create database tables first
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Then add sample data
    db = SessionLocal()
    try:
        create_sample_data(db)
        print("Sample data created successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    setup()
