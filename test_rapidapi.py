import asyncio
import httpx

async def test_gst(gst_number, key):
    url = f"https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/{gst_number}"
    headers = {
        "x-rapidapi-host": "gst-insights-api.p.rapidapi.com",
        "x-rapidapi-key": key
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        print("Status code:", response.status_code)
        print("Response:", response.json())

asyncio.run(test_gst("20AAACT2727Q1ZA", "422a5c5586msh19488523126df43p1da44ajsnb8210fd21321"))
