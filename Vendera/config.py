import os
import random as rd


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-later")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///vendera.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False