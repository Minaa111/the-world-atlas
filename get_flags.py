import urllib.request, json
# Let's search Wikipedia for these entities using the API
def get_flag_url(title):
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&format=json&pithumbsize=100"
        req = urllib.request.urlopen(url)
        res = json.loads(req.read())
        pages = res['query']['pages']
        for page_id in pages:
            return pages[page_id].get('thumbnail', {}).get('source', '')
    except:
        return ''

print("Canada:")
for p in ["Ontario", "Quebec", "Nova Scotia", "New Brunswick", "Manitoba", "British Columbia", "Prince Edward Island", "Saskatchewan", "Alberta", "Newfoundland and Labrador", "Northwest Territories", "Yukon", "Nunavut"]:
    print(f"'{p}': '{get_flag_url('Flag of ' + p)}',")

print("Australia:")
for p in ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"]:
    print(f"'{p}': '{get_flag_url('Flag of ' + p)}',")
