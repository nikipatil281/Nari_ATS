import asyncio
from backend.utils import search_github

data = search_github("Nikita Somashekar Patil", "", "nikipatil281")
print("Data for nikipatil281:")
print(data)

