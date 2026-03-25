# TODO
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MARIADB_USER: str
    MARIADB_PASSWORD: str
    MARIADB_DATABASE: str
    
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ADMIN_EMAIL: str
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mariadb+pymysql://{self.MARIADB_USER}:{self.MARIADB_PASSWORD}@mariadb:3306/{self.MARIADB_DATABASE}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
