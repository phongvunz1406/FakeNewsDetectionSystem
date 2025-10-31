from pydantic import BaseModel,Field

#user input class which is for input data validation 
class UserInput(BaseModel):
    statement: str = Field(..., description="News headline/claim")
    fullText_based_content: str = Field(default="", description="Full article text")
    speaker: str = Field(default="", description="Person or organization")
    sources: str = Field(default="", description="Comma-separated URLs or source list")