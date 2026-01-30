const { DateTime } = require("luxon");

// Default time zones chart
const DEFAULT_TIME_ZONES = [
  { label: "🇮🇳 India (Mumbai)", zone: "Asia/Kolkata" },
  { label: "🇺🇸 USA (New York)", zone: "America/New_York" },
  { label: "🇬🇧 UK (London)", zone: "Europe/London" },
  { label: "🇯🇵 Japan (Tokyo)", zone: "Asia/Tokyo" },
  { label: "🇦🇺 Australia (Sydney)", zone: "Australia/Sydney" },
];

// Comprehensive city to timezone lookup map
const CITY_TIMEZONE_MAP = {
  // ============ INDIA ============
  "mumbai": { label: "🇮🇳 India (Mumbai)", zone: "Asia/Kolkata" },
  "delhi": { label: "🇮🇳 India (Delhi)", zone: "Asia/Kolkata" },
  "new delhi": { label: "🇮🇳 India (New Delhi)", zone: "Asia/Kolkata" },
  "bangalore": { label: "🇮🇳 India (Bangalore)", zone: "Asia/Kolkata" },
  "bengaluru": { label: "🇮🇳 India (Bengaluru)", zone: "Asia/Kolkata" },
  "chennai": { label: "🇮🇳 India (Chennai)", zone: "Asia/Kolkata" },
  "kolkata": { label: "🇮🇳 India (Kolkata)", zone: "Asia/Kolkata" },
  "hyderabad": { label: "🇮🇳 India (Hyderabad)", zone: "Asia/Kolkata" },
  "pune": { label: "🇮🇳 India (Pune)", zone: "Asia/Kolkata" },
  "ahmedabad": { label: "🇮🇳 India (Ahmedabad)", zone: "Asia/Kolkata" },
  "jaipur": { label: "🇮🇳 India (Jaipur)", zone: "Asia/Kolkata" },
  "surat": { label: "🇮🇳 India (Surat)", zone: "Asia/Kolkata" },
  "lucknow": { label: "🇮🇳 India (Lucknow)", zone: "Asia/Kolkata" },
  "kanpur": { label: "🇮🇳 India (Kanpur)", zone: "Asia/Kolkata" },
  "nagpur": { label: "🇮🇳 India (Nagpur)", zone: "Asia/Kolkata" },
  "indore": { label: "🇮🇳 India (Indore)", zone: "Asia/Kolkata" },
  "thane": { label: "🇮🇳 India (Thane)", zone: "Asia/Kolkata" },
  "bhopal": { label: "🇮🇳 India (Bhopal)", zone: "Asia/Kolkata" },
  "visakhapatnam": { label: "🇮🇳 India (Visakhapatnam)", zone: "Asia/Kolkata" },
  "vadodara": { label: "🇮🇳 India (Vadodara)", zone: "Asia/Kolkata" },
  "goa": { label: "🇮🇳 India (Goa)", zone: "Asia/Kolkata" },
  "chandigarh": { label: "🇮🇳 India (Chandigarh)", zone: "Asia/Kolkata" },
  "coimbatore": { label: "🇮🇳 India (Coimbatore)", zone: "Asia/Kolkata" },
  "kochi": { label: "🇮🇳 India (Kochi)", zone: "Asia/Kolkata" },
  "trivandrum": { label: "🇮🇳 India (Trivandrum)", zone: "Asia/Kolkata" },
  "india": { label: "🇮🇳 India", zone: "Asia/Kolkata" },

  // ============ USA - EASTERN ============
  "new york": { label: "🇺🇸 USA (New York)", zone: "America/New_York" },
  "newyork": { label: "🇺🇸 USA (New York)", zone: "America/New_York" },
  "nyc": { label: "🇺🇸 USA (New York)", zone: "America/New_York" },
  "miami": { label: "🇺🇸 USA (Miami)", zone: "America/New_York" },
  "boston": { label: "🇺🇸 USA (Boston)", zone: "America/New_York" },
  "philadelphia": { label: "🇺🇸 USA (Philadelphia)", zone: "America/New_York" },
  "atlanta": { label: "🇺🇸 USA (Atlanta)", zone: "America/New_York" },
  "washington dc": { label: "🇺🇸 USA (Washington DC)", zone: "America/New_York" },
  "dc": { label: "🇺🇸 USA (Washington DC)", zone: "America/New_York" },
  "charlotte": { label: "🇺🇸 USA (Charlotte)", zone: "America/New_York" },
  "detroit": { label: "🇺🇸 USA (Detroit)", zone: "America/New_York" },
  "orlando": { label: "🇺🇸 USA (Orlando)", zone: "America/New_York" },
  "tampa": { label: "🇺🇸 USA (Tampa)", zone: "America/New_York" },
  "jacksonville": { label: "🇺🇸 USA (Jacksonville)", zone: "America/New_York" },
  "baltimore": { label: "🇺🇸 USA (Baltimore)", zone: "America/New_York" },
  "pittsburgh": { label: "🇺🇸 USA (Pittsburgh)", zone: "America/New_York" },
  "cleveland": { label: "🇺🇸 USA (Cleveland)", zone: "America/New_York" },
  "columbus": { label: "🇺🇸 USA (Columbus)", zone: "America/New_York" },
  "cincinnati": { label: "🇺🇸 USA (Cincinnati)", zone: "America/New_York" },
  "indianapolis": { label: "🇺🇸 USA (Indianapolis)", zone: "America/New_York" },
  "raleigh": { label: "🇺🇸 USA (Raleigh)", zone: "America/New_York" },
  "buffalo": { label: "🇺🇸 USA (Buffalo)", zone: "America/New_York" },
  "providence": { label: "🇺🇸 USA (Providence)", zone: "America/New_York" },
  "hartford": { label: "🇺🇸 USA (Hartford)", zone: "America/New_York" },
  "richmond": { label: "🇺🇸 USA (Richmond)", zone: "America/New_York" },
  "florida": { label: "🇺🇸 USA (Florida)", zone: "America/New_York" },
  "georgia": { label: "🇺🇸 USA (Georgia)", zone: "America/New_York" },
  "ohio": { label: "🇺🇸 USA (Ohio)", zone: "America/New_York" },
  "virginia": { label: "🇺🇸 USA (Virginia)", zone: "America/New_York" },
  "massachusetts": { label: "🇺🇸 USA (Massachusetts)", zone: "America/New_York" },
  "pennsylvania": { label: "🇺🇸 USA (Pennsylvania)", zone: "America/New_York" },
  "new jersey": { label: "🇺🇸 USA (New Jersey)", zone: "America/New_York" },
  "michigan": { label: "🇺🇸 USA (Michigan)", zone: "America/New_York" },
  "north carolina": { label: "🇺🇸 USA (North Carolina)", zone: "America/New_York" },
  "south carolina": { label: "🇺🇸 USA (South Carolina)", zone: "America/New_York" },

  // ============ USA - CENTRAL ============
  "chicago": { label: "🇺🇸 USA (Chicago)", zone: "America/Chicago" },
  "houston": { label: "🇺🇸 USA (Houston)", zone: "America/Chicago" },
  "dallas": { label: "🇺🇸 USA (Dallas)", zone: "America/Chicago" },
  "austin": { label: "🇺🇸 USA (Austin)", zone: "America/Chicago" },
  "san antonio": { label: "🇺🇸 USA (San Antonio)", zone: "America/Chicago" },
  "minneapolis": { label: "🇺🇸 USA (Minneapolis)", zone: "America/Chicago" },
  "new orleans": { label: "🇺🇸 USA (New Orleans)", zone: "America/Chicago" },
  "nashville": { label: "🇺🇸 USA (Nashville)", zone: "America/Chicago" },
  "memphis": { label: "🇺🇸 USA (Memphis)", zone: "America/Chicago" },
  "oklahoma city": { label: "🇺🇸 USA (Oklahoma City)", zone: "America/Chicago" },
  "milwaukee": { label: "🇺🇸 USA (Milwaukee)", zone: "America/Chicago" },
  "kansas city": { label: "🇺🇸 USA (Kansas City)", zone: "America/Chicago" },
  "st louis": { label: "🇺🇸 USA (St. Louis)", zone: "America/Chicago" },
  "omaha": { label: "🇺🇸 USA (Omaha)", zone: "America/Chicago" },
  "tulsa": { label: "🇺🇸 USA (Tulsa)", zone: "America/Chicago" },
  "wichita": { label: "🇺🇸 USA (Wichita)", zone: "America/Chicago" },
  "louisville": { label: "🇺🇸 USA (Louisville)", zone: "America/Chicago" },
  "madison": { label: "🇺🇸 USA (Madison)", zone: "America/Chicago" },
  "texas": { label: "🇺🇸 USA (Texas)", zone: "America/Chicago" },
  "illinois": { label: "🇺🇸 USA (Illinois)", zone: "America/Chicago" },
  "tennessee": { label: "🇺🇸 USA (Tennessee)", zone: "America/Chicago" },
  "louisiana": { label: "🇺🇸 USA (Louisiana)", zone: "America/Chicago" },
  "alabama": { label: "🇺🇸 USA (Alabama)", zone: "America/Chicago" },
  "mississippi": { label: "🇺🇸 USA (Mississippi)", zone: "America/Chicago" },
  "arkansas": { label: "🇺🇸 USA (Arkansas)", zone: "America/Chicago" },
  "iowa": { label: "🇺🇸 USA (Iowa)", zone: "America/Chicago" },
  "minnesota": { label: "🇺🇸 USA (Minnesota)", zone: "America/Chicago" },
  "wisconsin": { label: "🇺🇸 USA (Wisconsin)", zone: "America/Chicago" },
  "missouri": { label: "🇺🇸 USA (Missouri)", zone: "America/Chicago" },
  "kansas": { label: "🇺🇸 USA (Kansas)", zone: "America/Chicago" },
  "nebraska": { label: "🇺🇸 USA (Nebraska)", zone: "America/Chicago" },
  "oklahoma": { label: "🇺🇸 USA (Oklahoma)", zone: "America/Chicago" },

  // ============ USA - MOUNTAIN ============
  "denver": { label: "🇺🇸 USA (Denver)", zone: "America/Denver" },
  "phoenix": { label: "🇺🇸 USA (Phoenix)", zone: "America/Phoenix" },
  "salt lake city": { label: "🇺🇸 USA (Salt Lake City)", zone: "America/Denver" },
  "albuquerque": { label: "🇺🇸 USA (Albuquerque)", zone: "America/Denver" },
  "tucson": { label: "🇺🇸 USA (Tucson)", zone: "America/Phoenix" },
  "el paso": { label: "🇺🇸 USA (El Paso)", zone: "America/Denver" },
  "colorado springs": { label: "🇺🇸 USA (Colorado Springs)", zone: "America/Denver" },
  "boise": { label: "🇺🇸 USA (Boise)", zone: "America/Boise" },
  "colorado": { label: "🇺🇸 USA (Colorado)", zone: "America/Denver" },
  "arizona": { label: "🇺🇸 USA (Arizona)", zone: "America/Phoenix" },
  "utah": { label: "🇺🇸 USA (Utah)", zone: "America/Denver" },
  "new mexico": { label: "🇺🇸 USA (New Mexico)", zone: "America/Denver" },
  "wyoming": { label: "🇺🇸 USA (Wyoming)", zone: "America/Denver" },
  "montana": { label: "🇺🇸 USA (Montana)", zone: "America/Denver" },
  "idaho": { label: "🇺🇸 USA (Idaho)", zone: "America/Boise" },

  // ============ USA - PACIFIC ============
  "los angeles": { label: "🇺🇸 USA (Los Angeles)", zone: "America/Los_Angeles" },
  "la": { label: "🇺🇸 USA (Los Angeles)", zone: "America/Los_Angeles" },
  "california": { label: "🇺🇸 USA (California)", zone: "America/Los_Angeles" },
  "san francisco": { label: "🇺🇸 USA (San Francisco)", zone: "America/Los_Angeles" },
  "sf": { label: "🇺🇸 USA (San Francisco)", zone: "America/Los_Angeles" },
  "san diego": { label: "🇺🇸 USA (San Diego)", zone: "America/Los_Angeles" },
  "san jose": { label: "🇺🇸 USA (San Jose)", zone: "America/Los_Angeles" },
  "sacramento": { label: "🇺🇸 USA (Sacramento)", zone: "America/Los_Angeles" },
  "oakland": { label: "🇺🇸 USA (Oakland)", zone: "America/Los_Angeles" },
  "fresno": { label: "🇺🇸 USA (Fresno)", zone: "America/Los_Angeles" },
  "long beach": { label: "🇺🇸 USA (Long Beach)", zone: "America/Los_Angeles" },
  "bakersfield": { label: "🇺🇸 USA (Bakersfield)", zone: "America/Los_Angeles" },
  "anaheim": { label: "🇺🇸 USA (Anaheim)", zone: "America/Los_Angeles" },
  "santa ana": { label: "🇺🇸 USA (Santa Ana)", zone: "America/Los_Angeles" },
  "riverside": { label: "🇺🇸 USA (Riverside)", zone: "America/Los_Angeles" },
  "stockton": { label: "🇺🇸 USA (Stockton)", zone: "America/Los_Angeles" },
  "irvine": { label: "🇺🇸 USA (Irvine)", zone: "America/Los_Angeles" },
  "santa monica": { label: "🇺🇸 USA (Santa Monica)", zone: "America/Los_Angeles" },
  "hollywood": { label: "🇺🇸 USA (Hollywood)", zone: "America/Los_Angeles" },
  "beverly hills": { label: "🇺🇸 USA (Beverly Hills)", zone: "America/Los_Angeles" },
  "palo alto": { label: "🇺🇸 USA (Palo Alto)", zone: "America/Los_Angeles" },
  "silicon valley": { label: "🇺🇸 USA (Silicon Valley)", zone: "America/Los_Angeles" },
  "las vegas": { label: "🇺🇸 USA (Las Vegas)", zone: "America/Los_Angeles" },
  "vegas": { label: "🇺🇸 USA (Las Vegas)", zone: "America/Los_Angeles" },
  "reno": { label: "🇺🇸 USA (Reno)", zone: "America/Los_Angeles" },
  "seattle": { label: "🇺🇸 USA (Seattle)", zone: "America/Los_Angeles" },
  "tacoma": { label: "🇺🇸 USA (Tacoma)", zone: "America/Los_Angeles" },
  "spokane": { label: "🇺🇸 USA (Spokane)", zone: "America/Los_Angeles" },
  "bellevue": { label: "🇺🇸 USA (Bellevue)", zone: "America/Los_Angeles" },
  "washington": { label: "🇺🇸 USA (Washington State)", zone: "America/Los_Angeles" },
  "portland": { label: "🇺🇸 USA (Portland)", zone: "America/Los_Angeles" },
  "oregon": { label: "🇺🇸 USA (Oregon)", zone: "America/Los_Angeles" },
  "nevada": { label: "🇺🇸 USA (Nevada)", zone: "America/Los_Angeles" },

  // ============ USA - ALASKA & HAWAII ============
  "anchorage": { label: "🇺🇸 USA (Anchorage)", zone: "America/Anchorage" },
  "alaska": { label: "🇺🇸 USA (Alaska)", zone: "America/Anchorage" },
  "fairbanks": { label: "🇺🇸 USA (Fairbanks)", zone: "America/Anchorage" },
  "juneau": { label: "🇺🇸 USA (Juneau)", zone: "America/Juneau" },
  "honolulu": { label: "🇺🇸 USA (Honolulu)", zone: "Pacific/Honolulu" },
  "hawaii": { label: "🇺🇸 USA (Hawaii)", zone: "Pacific/Honolulu" },

  // ============ UK & IRELAND ============
  "london": { label: "🇬🇧 UK (London)", zone: "Europe/London" },
  "manchester": { label: "🇬🇧 UK (Manchester)", zone: "Europe/London" },
  "birmingham": { label: "🇬🇧 UK (Birmingham)", zone: "Europe/London" },
  "leeds": { label: "🇬🇧 UK (Leeds)", zone: "Europe/London" },
  "glasgow": { label: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland (Glasgow)", zone: "Europe/London" },
  "edinburgh": { label: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland (Edinburgh)", zone: "Europe/London" },
  "liverpool": { label: "🇬🇧 UK (Liverpool)", zone: "Europe/London" },
  "bristol": { label: "🇬🇧 UK (Bristol)", zone: "Europe/London" },
  "cardiff": { label: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales (Cardiff)", zone: "Europe/London" },
  "belfast": { label: "🇬🇧 UK (Belfast)", zone: "Europe/London" },
  "sheffield": { label: "🇬🇧 UK (Sheffield)", zone: "Europe/London" },
  "newcastle": { label: "🇬🇧 UK (Newcastle)", zone: "Europe/London" },
  "nottingham": { label: "🇬🇧 UK (Nottingham)", zone: "Europe/London" },
  "cambridge": { label: "🇬🇧 UK (Cambridge)", zone: "Europe/London" },
  "oxford": { label: "🇬🇧 UK (Oxford)", zone: "Europe/London" },
  "uk": { label: "🇬🇧 United Kingdom", zone: "Europe/London" },
  "england": { label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", zone: "Europe/London" },
  "scotland": { label: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland", zone: "Europe/London" },
  "wales": { label: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales", zone: "Europe/London" },
  "dublin": { label: "🇮🇪 Ireland (Dublin)", zone: "Europe/Dublin" },
  "cork": { label: "🇮🇪 Ireland (Cork)", zone: "Europe/Dublin" },
  "ireland": { label: "🇮🇪 Ireland", zone: "Europe/Dublin" },

  // ============ WESTERN EUROPE ============
  "paris": { label: "🇫🇷 France (Paris)", zone: "Europe/Paris" },
  "marseille": { label: "🇫🇷 France (Marseille)", zone: "Europe/Paris" },
  "lyon": { label: "🇫🇷 France (Lyon)", zone: "Europe/Paris" },
  "nice": { label: "🇫🇷 France (Nice)", zone: "Europe/Paris" },
  "toulouse": { label: "🇫🇷 France (Toulouse)", zone: "Europe/Paris" },
  "france": { label: "🇫🇷 France", zone: "Europe/Paris" },
  "berlin": { label: "🇩🇪 Germany (Berlin)", zone: "Europe/Berlin" },
  "munich": { label: "🇩🇪 Germany (Munich)", zone: "Europe/Berlin" },
  "frankfurt": { label: "🇩🇪 Germany (Frankfurt)", zone: "Europe/Berlin" },
  "hamburg": { label: "🇩🇪 Germany (Hamburg)", zone: "Europe/Berlin" },
  "cologne": { label: "🇩🇪 Germany (Cologne)", zone: "Europe/Berlin" },
  "dusseldorf": { label: "🇩🇪 Germany (Düsseldorf)", zone: "Europe/Berlin" },
  "stuttgart": { label: "🇩🇪 Germany (Stuttgart)", zone: "Europe/Berlin" },
  "germany": { label: "🇩🇪 Germany", zone: "Europe/Berlin" },
  "amsterdam": { label: "🇳🇱 Netherlands (Amsterdam)", zone: "Europe/Amsterdam" },
  "rotterdam": { label: "🇳🇱 Netherlands (Rotterdam)", zone: "Europe/Amsterdam" },
  "the hague": { label: "🇳🇱 Netherlands (The Hague)", zone: "Europe/Amsterdam" },
  "netherlands": { label: "🇳🇱 Netherlands", zone: "Europe/Amsterdam" },
  "holland": { label: "🇳🇱 Netherlands", zone: "Europe/Amsterdam" },
  "brussels": { label: "🇧🇪 Belgium (Brussels)", zone: "Europe/Brussels" },
  "belgium": { label: "🇧🇪 Belgium", zone: "Europe/Brussels" },
  "luxembourg": { label: "🇱🇺 Luxembourg", zone: "Europe/Luxembourg" },
  "zurich": { label: "🇨🇭 Switzerland (Zurich)", zone: "Europe/Zurich" },
  "geneva": { label: "🇨🇭 Switzerland (Geneva)", zone: "Europe/Zurich" },
  "bern": { label: "🇨🇭 Switzerland (Bern)", zone: "Europe/Zurich" },
  "switzerland": { label: "🇨🇭 Switzerland", zone: "Europe/Zurich" },

  // ============ SOUTHERN EUROPE ============
  "rome": { label: "🇮🇹 Italy (Rome)", zone: "Europe/Rome" },
  "milan": { label: "🇮🇹 Italy (Milan)", zone: "Europe/Rome" },
  "venice": { label: "🇮🇹 Italy (Venice)", zone: "Europe/Rome" },
  "florence": { label: "🇮🇹 Italy (Florence)", zone: "Europe/Rome" },
  "naples": { label: "🇮🇹 Italy (Naples)", zone: "Europe/Rome" },
  "turin": { label: "🇮🇹 Italy (Turin)", zone: "Europe/Rome" },
  "italy": { label: "🇮🇹 Italy", zone: "Europe/Rome" },
  "madrid": { label: "🇪🇸 Spain (Madrid)", zone: "Europe/Madrid" },
  "barcelona": { label: "🇪🇸 Spain (Barcelona)", zone: "Europe/Madrid" },
  "valencia": { label: "🇪🇸 Spain (Valencia)", zone: "Europe/Madrid" },
  "seville": { label: "🇪🇸 Spain (Seville)", zone: "Europe/Madrid" },
  "malaga": { label: "🇪🇸 Spain (Malaga)", zone: "Europe/Madrid" },
  "spain": { label: "🇪🇸 Spain", zone: "Europe/Madrid" },
  "lisbon": { label: "🇵🇹 Portugal (Lisbon)", zone: "Europe/Lisbon" },
  "porto": { label: "🇵🇹 Portugal (Porto)", zone: "Europe/Lisbon" },
  "portugal": { label: "🇵🇹 Portugal", zone: "Europe/Lisbon" },
  "athens": { label: "🇬🇷 Greece (Athens)", zone: "Europe/Athens" },
  "greece": { label: "🇬🇷 Greece", zone: "Europe/Athens" },

  // ============ CENTRAL EUROPE ============
  "vienna": { label: "🇦🇹 Austria (Vienna)", zone: "Europe/Vienna" },
  "salzburg": { label: "🇦🇹 Austria (Salzburg)", zone: "Europe/Vienna" },
  "austria": { label: "🇦🇹 Austria", zone: "Europe/Vienna" },
  "prague": { label: "🇨🇿 Czech Republic (Prague)", zone: "Europe/Prague" },
  "czech": { label: "🇨🇿 Czech Republic", zone: "Europe/Prague" },
  "budapest": { label: "🇭🇺 Hungary (Budapest)", zone: "Europe/Budapest" },
  "hungary": { label: "🇭🇺 Hungary", zone: "Europe/Budapest" },
  "warsaw": { label: "🇵🇱 Poland (Warsaw)", zone: "Europe/Warsaw" },
  "krakow": { label: "🇵🇱 Poland (Krakow)", zone: "Europe/Warsaw" },
  "poland": { label: "🇵🇱 Poland", zone: "Europe/Warsaw" },
  "copenhagen": { label: "🇩🇰 Denmark (Copenhagen)", zone: "Europe/Copenhagen" },
  "denmark": { label: "🇩🇰 Denmark", zone: "Europe/Copenhagen" },
  "stockholm": { label: "🇸🇪 Sweden (Stockholm)", zone: "Europe/Stockholm" },
  "sweden": { label: "🇸🇪 Sweden", zone: "Europe/Stockholm" },
  "oslo": { label: "🇳🇴 Norway (Oslo)", zone: "Europe/Oslo" },
  "norway": { label: "🇳🇴 Norway", zone: "Europe/Oslo" },
  "helsinki": { label: "🇫🇮 Finland (Helsinki)", zone: "Europe/Helsinki" },
  "finland": { label: "🇫🇮 Finland", zone: "Europe/Helsinki" },

  // ============ EASTERN EUROPE & RUSSIA ============
  "moscow": { label: "🇷🇺 Russia (Moscow)", zone: "Europe/Moscow" },
  "st petersburg": { label: "🇷🇺 Russia (St. Petersburg)", zone: "Europe/Moscow" },
  "russia": { label: "🇷🇺 Russia", zone: "Europe/Moscow" },
  "kyiv": { label: "🇺🇦 Ukraine (Kyiv)", zone: "Europe/Kyiv" },
  "kiev": { label: "🇺🇦 Ukraine (Kyiv)", zone: "Europe/Kyiv" },
  "ukraine": { label: "🇺🇦 Ukraine", zone: "Europe/Kyiv" },
  "bucharest": { label: "🇷🇴 Romania (Bucharest)", zone: "Europe/Bucharest" },
  "romania": { label: "🇷🇴 Romania", zone: "Europe/Bucharest" },
  "sofia": { label: "🇧🇬 Bulgaria (Sofia)", zone: "Europe/Sofia" },
  "bulgaria": { label: "🇧🇬 Bulgaria", zone: "Europe/Sofia" },

  // ============ MIDDLE EAST ============
  "dubai": { label: "🇦🇪 UAE (Dubai)", zone: "Asia/Dubai" },
  "abu dhabi": { label: "🇦🇪 UAE (Abu Dhabi)", zone: "Asia/Dubai" },
  "uae": { label: "🇦🇪 UAE", zone: "Asia/Dubai" },
  "riyadh": { label: "🇸🇦 Saudi Arabia (Riyadh)", zone: "Asia/Riyadh" },
  "jeddah": { label: "🇸🇦 Saudi Arabia (Jeddah)", zone: "Asia/Riyadh" },
  "mecca": { label: "🇸🇦 Saudi Arabia (Mecca)", zone: "Asia/Riyadh" },
  "saudi arabia": { label: "🇸🇦 Saudi Arabia", zone: "Asia/Riyadh" },
  "doha": { label: "🇶🇦 Qatar (Doha)", zone: "Asia/Qatar" },
  "qatar": { label: "🇶🇦 Qatar", zone: "Asia/Qatar" },
  "kuwait": { label: "🇰🇼 Kuwait", zone: "Asia/Kuwait" },
  "bahrain": { label: "🇧🇭 Bahrain", zone: "Asia/Bahrain" },
  "muscat": { label: "🇴🇲 Oman (Muscat)", zone: "Asia/Muscat" },
  "oman": { label: "🇴🇲 Oman", zone: "Asia/Muscat" },
  "tel aviv": { label: "🇮🇱 Israel (Tel Aviv)", zone: "Asia/Jerusalem" },
  "jerusalem": { label: "🇮🇱 Israel (Jerusalem)", zone: "Asia/Jerusalem" },
  "israel": { label: "🇮🇱 Israel", zone: "Asia/Jerusalem" },
  "beirut": { label: "🇱🇧 Lebanon (Beirut)", zone: "Asia/Beirut" },
  "lebanon": { label: "🇱🇧 Lebanon", zone: "Asia/Beirut" },
  "amman": { label: "🇯🇴 Jordan (Amman)", zone: "Asia/Amman" },
  "jordan": { label: "🇯🇴 Jordan", zone: "Asia/Amman" },
  "tehran": { label: "🇮🇷 Iran (Tehran)", zone: "Asia/Tehran" },
  "iran": { label: "🇮🇷 Iran", zone: "Asia/Tehran" },
  "istanbul": { label: "🇹🇷 Turkey (Istanbul)", zone: "Europe/Istanbul" },
  "ankara": { label: "🇹🇷 Turkey (Ankara)", zone: "Europe/Istanbul" },
  "turkey": { label: "🇹🇷 Turkey", zone: "Europe/Istanbul" },

  // ============ EAST ASIA ============
  "tokyo": { label: "🇯🇵 Japan (Tokyo)", zone: "Asia/Tokyo" },
  "osaka": { label: "🇯🇵 Japan (Osaka)", zone: "Asia/Tokyo" },
  "kyoto": { label: "🇯🇵 Japan (Kyoto)", zone: "Asia/Tokyo" },
  "yokohama": { label: "🇯🇵 Japan (Yokohama)", zone: "Asia/Tokyo" },
  "nagoya": { label: "🇯🇵 Japan (Nagoya)", zone: "Asia/Tokyo" },
  "sapporo": { label: "🇯🇵 Japan (Sapporo)", zone: "Asia/Tokyo" },
  "fukuoka": { label: "🇯🇵 Japan (Fukuoka)", zone: "Asia/Tokyo" },
  "japan": { label: "🇯🇵 Japan", zone: "Asia/Tokyo" },
  "seoul": { label: "🇰🇷 South Korea (Seoul)", zone: "Asia/Seoul" },
  "busan": { label: "🇰🇷 South Korea (Busan)", zone: "Asia/Seoul" },
  "korea": { label: "🇰🇷 South Korea", zone: "Asia/Seoul" },
  "south korea": { label: "🇰🇷 South Korea", zone: "Asia/Seoul" },
  "beijing": { label: "🇨🇳 China (Beijing)", zone: "Asia/Shanghai" },
  "shanghai": { label: "🇨🇳 China (Shanghai)", zone: "Asia/Shanghai" },
  "guangzhou": { label: "🇨🇳 China (Guangzhou)", zone: "Asia/Shanghai" },
  "shenzhen": { label: "🇨🇳 China (Shenzhen)", zone: "Asia/Shanghai" },
  "hong kong": { label: "🇭🇰 Hong Kong", zone: "Asia/Hong_Kong" },
  "hongkong": { label: "🇭🇰 Hong Kong", zone: "Asia/Hong_Kong" },
  "hk": { label: "🇭🇰 Hong Kong", zone: "Asia/Hong_Kong" },
  "macau": { label: "🇲🇴 Macau", zone: "Asia/Macau" },
  "taiwan": { label: "🇹🇼 Taiwan", zone: "Asia/Taipei" },
  "taipei": { label: "🇹🇼 Taiwan (Taipei)", zone: "Asia/Taipei" },
  "china": { label: "🇨🇳 China", zone: "Asia/Shanghai" },

  // ============ SOUTHEAST ASIA ============
  "singapore": { label: "🇸🇬 Singapore", zone: "Asia/Singapore" },
  "sg": { label: "🇸🇬 Singapore", zone: "Asia/Singapore" },
  "kuala lumpur": { label: "🇲🇾 Malaysia (Kuala Lumpur)", zone: "Asia/Kuala_Lumpur" },
  "kl": { label: "🇲🇾 Malaysia (Kuala Lumpur)", zone: "Asia/Kuala_Lumpur" },
  "malaysia": { label: "🇲🇾 Malaysia", zone: "Asia/Kuala_Lumpur" },
  "bangkok": { label: "🇹🇭 Thailand (Bangkok)", zone: "Asia/Bangkok" },
  "phuket": { label: "🇹🇭 Thailand (Phuket)", zone: "Asia/Bangkok" },
  "thailand": { label: "🇹🇭 Thailand", zone: "Asia/Bangkok" },
  "jakarta": { label: "🇮🇩 Indonesia (Jakarta)", zone: "Asia/Jakarta" },
  "bali": { label: "🇮🇩 Indonesia (Bali)", zone: "Asia/Makassar" },
  "indonesia": { label: "🇮🇩 Indonesia", zone: "Asia/Jakarta" },
  "manila": { label: "🇵🇭 Philippines (Manila)", zone: "Asia/Manila" },
  "dumaguete": { label: "🇵🇭 Philippines (Dumaguete)", zone: "Asia/Manila" },
  "cebu": { label: "🇵🇭 Philippines (Cebu)", zone: "Asia/Manila" },
  "davao": { label: "🇵🇭 Philippines (Davao)", zone: "Asia/Manila" },
  "quezon city": { label: "🇵🇭 Philippines (Quezon City)", zone: "Asia/Manila" },
  "makati": { label: "🇵🇭 Philippines (Makati)", zone: "Asia/Manila" },
  "iloilo": { label: "🇵🇭 Philippines (Iloilo)", zone: "Asia/Manila" },
  "bacolod": { label: "🇵🇭 Philippines (Bacolod)", zone: "Asia/Manila" },
  "cagayan de oro": { label: "🇵🇭 Philippines (Cagayan de Oro)", zone: "Asia/Manila" },
  "baguio": { label: "🇵🇭 Philippines (Baguio)", zone: "Asia/Manila" },
  "zamboanga": { label: "🇵🇭 Philippines (Zamboanga)", zone: "Asia/Manila" },
  "philippines": { label: "🇵🇭 Philippines", zone: "Asia/Manila" },
  "ho chi minh": { label: "🇻🇳 Vietnam (Ho Chi Minh)", zone: "Asia/Ho_Chi_Minh" },
  "hanoi": { label: "🇻🇳 Vietnam (Hanoi)", zone: "Asia/Ho_Chi_Minh" },
  "vietnam": { label: "🇻🇳 Vietnam", zone: "Asia/Ho_Chi_Minh" },
  "phnom penh": { label: "🇰🇭 Cambodia (Phnom Penh)", zone: "Asia/Phnom_Penh" },
  "cambodia": { label: "🇰🇭 Cambodia", zone: "Asia/Phnom_Penh" },
  "yangon": { label: "🇲🇲 Myanmar (Yangon)", zone: "Asia/Yangon" },
  "myanmar": { label: "🇲🇲 Myanmar", zone: "Asia/Yangon" },

  // ============ SOUTH ASIA ============
  "dhaka": { label: "🇧🇩 Bangladesh (Dhaka)", zone: "Asia/Dhaka" },
  "bangladesh": { label: "🇧🇩 Bangladesh", zone: "Asia/Dhaka" },
  "colombo": { label: "🇱🇰 Sri Lanka (Colombo)", zone: "Asia/Colombo" },
  "sri lanka": { label: "🇱🇰 Sri Lanka", zone: "Asia/Colombo" },
  "kathmandu": { label: "🇳🇵 Nepal (Kathmandu)", zone: "Asia/Kathmandu" },
  "nepal": { label: "🇳🇵 Nepal", zone: "Asia/Kathmandu" },
  "karachi": { label: "🇵🇰 Pakistan (Karachi)", zone: "Asia/Karachi" },
  "lahore": { label: "🇵🇰 Pakistan (Lahore)", zone: "Asia/Karachi" },
  "islamabad": { label: "🇵🇰 Pakistan (Islamabad)", zone: "Asia/Karachi" },
  "pakistan": { label: "🇵🇰 Pakistan", zone: "Asia/Karachi" },

  // ============ AUSTRALIA & NEW ZEALAND ============
  "sydney": { label: "🇦🇺 Australia (Sydney)", zone: "Australia/Sydney" },
  "melbourne": { label: "🇦🇺 Australia (Melbourne)", zone: "Australia/Melbourne" },
  "brisbane": { label: "🇦🇺 Australia (Brisbane)", zone: "Australia/Brisbane" },
  "perth": { label: "🇦🇺 Australia (Perth)", zone: "Australia/Perth" },
  "adelaide": { label: "🇦🇺 Australia (Adelaide)", zone: "Australia/Adelaide" },
  "canberra": { label: "🇦🇺 Australia (Canberra)", zone: "Australia/Sydney" },
  "hobart": { label: "🇦🇺 Australia (Hobart)", zone: "Australia/Hobart" },
  "darwin": { label: "🇦🇺 Australia (Darwin)", zone: "Australia/Darwin" },
  "gold coast": { label: "🇦🇺 Australia (Gold Coast)", zone: "Australia/Brisbane" },
  "australia": { label: "🇦🇺 Australia", zone: "Australia/Sydney" },
  "auckland": { label: "🇳🇿 New Zealand (Auckland)", zone: "Pacific/Auckland" },
  "wellington": { label: "🇳🇿 New Zealand (Wellington)", zone: "Pacific/Auckland" },
  "christchurch": { label: "🇳🇿 New Zealand (Christchurch)", zone: "Pacific/Auckland" },
  "new zealand": { label: "🇳🇿 New Zealand", zone: "Pacific/Auckland" },
  "nz": { label: "🇳🇿 New Zealand", zone: "Pacific/Auckland" },

  // ============ CANADA ============
  "toronto": { label: "🇨🇦 Canada (Toronto)", zone: "America/Toronto" },
  "vancouver": { label: "🇨🇦 Canada (Vancouver)", zone: "America/Vancouver" },
  "montreal": { label: "🇨🇦 Canada (Montreal)", zone: "America/Montreal" },
  "calgary": { label: "🇨🇦 Canada (Calgary)", zone: "America/Edmonton" },
  "edmonton": { label: "🇨🇦 Canada (Edmonton)", zone: "America/Edmonton" },
  "ottawa": { label: "🇨🇦 Canada (Ottawa)", zone: "America/Toronto" },
  "winnipeg": { label: "🇨🇦 Canada (Winnipeg)", zone: "America/Winnipeg" },
  "quebec": { label: "🇨🇦 Canada (Quebec)", zone: "America/Montreal" },
  "halifax": { label: "🇨🇦 Canada (Halifax)", zone: "America/Halifax" },
  "victoria": { label: "🇨🇦 Canada (Victoria)", zone: "America/Vancouver" },
  "canada": { label: "🇨🇦 Canada", zone: "America/Toronto" },

  // ============ LATIN AMERICA ============
  "mexico city": { label: "🇲🇽 Mexico (Mexico City)", zone: "America/Mexico_City" },
  "cancun": { label: "🇲🇽 Mexico (Cancun)", zone: "America/Cancun" },
  "tijuana": { label: "🇲🇽 Mexico (Tijuana)", zone: "America/Tijuana" },
  "guadalajara": { label: "🇲🇽 Mexico (Guadalajara)", zone: "America/Mexico_City" },
  "monterrey": { label: "🇲🇽 Mexico (Monterrey)", zone: "America/Monterrey" },
  "mexico": { label: "🇲🇽 Mexico", zone: "America/Mexico_City" },
  "sao paulo": { label: "🇧🇷 Brazil (São Paulo)", zone: "America/Sao_Paulo" },
  "rio de janeiro": { label: "🇧🇷 Brazil (Rio de Janeiro)", zone: "America/Sao_Paulo" },
  "rio": { label: "🇧🇷 Brazil (Rio de Janeiro)", zone: "America/Sao_Paulo" },
  "brasilia": { label: "🇧🇷 Brazil (Brasília)", zone: "America/Sao_Paulo" },
  "brazil": { label: "🇧🇷 Brazil", zone: "America/Sao_Paulo" },
  "buenos aires": { label: "🇦🇷 Argentina (Buenos Aires)", zone: "America/Argentina/Buenos_Aires" },
  "argentina": { label: "🇦🇷 Argentina", zone: "America/Argentina/Buenos_Aires" },
  "santiago": { label: "🇨🇱 Chile (Santiago)", zone: "America/Santiago" },
  "chile": { label: "🇨🇱 Chile", zone: "America/Santiago" },
  "bogota": { label: "🇨🇴 Colombia (Bogotá)", zone: "America/Bogota" },
  "colombia": { label: "🇨🇴 Colombia", zone: "America/Bogota" },
  "lima": { label: "🇵🇪 Peru (Lima)", zone: "America/Lima" },
  "peru": { label: "🇵🇪 Peru", zone: "America/Lima" },
  "caracas": { label: "🇻🇪 Venezuela (Caracas)", zone: "America/Caracas" },
  "venezuela": { label: "🇻🇪 Venezuela", zone: "America/Caracas" },
  "quito": { label: "🇪🇨 Ecuador (Quito)", zone: "America/Guayaquil" },
  "ecuador": { label: "🇪🇨 Ecuador", zone: "America/Guayaquil" },
  "panama": { label: "🇵🇦 Panama", zone: "America/Panama" },
  "havana": { label: "🇨🇺 Cuba (Havana)", zone: "America/Havana" },
  "cuba": { label: "🇨🇺 Cuba", zone: "America/Havana" },
  "san juan": { label: "🇵🇷 Puerto Rico (San Juan)", zone: "America/Puerto_Rico" },
  "puerto rico": { label: "🇵🇷 Puerto Rico", zone: "America/Puerto_Rico" },

  // ============ AFRICA ============
  "cairo": { label: "🇪🇬 Egypt (Cairo)", zone: "Africa/Cairo" },
  "egypt": { label: "🇪🇬 Egypt", zone: "Africa/Cairo" },
  "johannesburg": { label: "🇿🇦 South Africa (Johannesburg)", zone: "Africa/Johannesburg" },
  "cape town": { label: "🇿🇦 South Africa (Cape Town)", zone: "Africa/Johannesburg" },
  "south africa": { label: "🇿🇦 South Africa", zone: "Africa/Johannesburg" },
  "lagos": { label: "🇳🇬 Nigeria (Lagos)", zone: "Africa/Lagos" },
  "abuja": { label: "🇳🇬 Nigeria (Abuja)", zone: "Africa/Lagos" },
  "nigeria": { label: "🇳🇬 Nigeria", zone: "Africa/Lagos" },
  "nairobi": { label: "🇰🇪 Kenya (Nairobi)", zone: "Africa/Nairobi" },
  "kenya": { label: "🇰🇪 Kenya", zone: "Africa/Nairobi" },
  "casablanca": { label: "🇲🇦 Morocco (Casablanca)", zone: "Africa/Casablanca" },
  "morocco": { label: "🇲🇦 Morocco", zone: "Africa/Casablanca" },
  "addis ababa": { label: "🇪🇹 Ethiopia (Addis Ababa)", zone: "Africa/Addis_Ababa" },
  "ethiopia": { label: "🇪🇹 Ethiopia", zone: "Africa/Addis_Ababa" },
  "accra": { label: "🇬🇭 Ghana (Accra)", zone: "Africa/Accra" },
  "ghana": { label: "🇬🇭 Ghana", zone: "Africa/Accra" },
  "dar es salaam": { label: "🇹🇿 Tanzania (Dar es Salaam)", zone: "Africa/Dar_es_Salaam" },
  "tanzania": { label: "🇹🇿 Tanzania", zone: "Africa/Dar_es_Salaam" },
  "tunis": { label: "🇹🇳 Tunisia (Tunis)", zone: "Africa/Tunis" },
  "tunisia": { label: "🇹🇳 Tunisia", zone: "Africa/Tunis" },
  "algiers": { label: "🇩🇿 Algeria (Algiers)", zone: "Africa/Algiers" },
  "algeria": { label: "🇩🇿 Algeria", zone: "Africa/Algiers" },

  // ============ PACIFIC ISLANDS ============
  "fiji": { label: "🇫🇯 Fiji", zone: "Pacific/Fiji" },
  "suva": { label: "🇫🇯 Fiji (Suva)", zone: "Pacific/Fiji" },
  "guam": { label: "🇬🇺 Guam", zone: "Pacific/Guam" },
  "samoa": { label: "🇼🇸 Samoa", zone: "Pacific/Apia" },
  "tahiti": { label: "🇵🇫 Tahiti", zone: "Pacific/Tahiti" },
  "tonga": { label: "🇹🇴 Tonga", zone: "Pacific/Tongatapu" },
  "palau": { label: "🇵🇼 Palau", zone: "Pacific/Palau" },

  // ============ CARIBBEAN ============
  "jamaica": { label: "🇯🇲 Jamaica", zone: "America/Jamaica" },
  "kingston": { label: "🇯🇲 Jamaica (Kingston)", zone: "America/Jamaica" },
  "nassau": { label: "🇧🇸 Bahamas (Nassau)", zone: "America/Nassau" },
  "bahamas": { label: "🇧🇸 Bahamas", zone: "America/Nassau" },
  "barbados": { label: "🇧🇧 Barbados", zone: "America/Barbados" },
  "trinidad": { label: "🇹🇹 Trinidad and Tobago", zone: "America/Port_of_Spain" },
  "aruba": { label: "🇦🇼 Aruba", zone: "America/Aruba" },
  "cayman islands": { label: "🇰🇾 Cayman Islands", zone: "America/Cayman" },
  "dominican republic": { label: "🇩🇴 Dominican Republic", zone: "America/Santo_Domingo" },
  "santo domingo": { label: "🇩🇴 Dominican Republic (Santo Domingo)", zone: "America/Santo_Domingo" },
};
/**
 * Get day/night indicator based on hour
 * @param {number} hour - Hour (0-23)
 * @returns {string} Emoji indicator
 */
function getDayNightIndicator(hour) {
  if (hour >= 6 && hour < 12) return "🌅"; // Morning
  if (hour >= 12 && hour < 18) return "☀️"; // Afternoon
  if (hour >= 18 && hour < 21) return "🌆"; // Evening
  return "🌙"; // Night
}

/**
 * Format a single timezone entry with current time (detailed view)
 * @param {Object} entry - { label, zone }
 * @param {string} format - '12h' or '24h' (default: '24h')
 * @param {boolean} showDate - Whether to show date (default: true)
 * @returns {string} Formatted string with day/night indicator, date, and time
 */
function formatTimeEntry(entry, format = '24h', showDate = true) {
  const now = DateTime.now().setZone(entry.zone);
  const timeFormat = format === '12h' ? "h:mm:ss a" : "HH:mm:ss";
  const time = now.toFormat(timeFormat);
  const indicator = getDayNightIndicator(now.hour);
  const offset = now.toFormat("ZZ"); // e.g., +05:30

  if (showDate) {
    const date = now.toFormat("ccc, LLL d"); // e.g., "Tue, Jan 28"
    return `${indicator} **${entry.label}** (UTC${offset})\n　　${date} • \`${time}\``;
  }
  return `${indicator} **${entry.label}** → \`${time}\``;
}

/**
 * Format a single timezone entry (compact view)
 * @param {Object} entry - { label, zone }
 * @param {string} format - '12h' or '24h'
 * @returns {string} Compact formatted string
 */
function formatTimeEntryCompact(entry, format = '24h') {
  const now = DateTime.now().setZone(entry.zone);
  const timeFormat = format === '12h' ? "h:mm a" : "HH:mm";
  const time = now.toFormat(timeFormat);
  const indicator = getDayNightIndicator(now.hour);
  return `${indicator} ${entry.label}: \`${time}\``;
}

/**
 * Generate time list from an array of timezone entries
 * @param {Array} entries - Array of { label, zone } objects
 * @param {string} format - '12h' or '24h' (default: '24h')
 * @param {string} view - 'detailed' or 'compact' (default: 'detailed')
 * @returns {string} Formatted multi-line string
 */
function generateTimeList(entries, format = '24h', view = 'detailed') {
  if (!entries || entries.length === 0) {
    return "*No timezones in this chart*";
  }
  if (view === 'compact') {
    return entries.map(entry => formatTimeEntryCompact(entry, format)).join("\n");
  }
  return entries.map(entry => formatTimeEntry(entry, format, true)).join("\n\n");
}

/**
 * Generate inline fields for embed (3 per row)
 * @param {Array} entries - Array of { label, zone } objects
 * @param {string} format - '12h' or '24h'
 * @returns {Array} Array of field objects for embed
 */
function generateInlineFields(entries, format = '24h') {
  return entries.map(entry => {
    const now = DateTime.now().setZone(entry.zone);
    const timeFormat = format === '12h' ? "h:mm a" : "HH:mm";
    const time = now.toFormat(timeFormat);
    const indicator = getDayNightIndicator(now.hour);
    const date = now.toFormat("LLL d");
    return {
      name: `${indicator} ${entry.label}`,
      value: `\`${time}\`\n${date}`,
      inline: true
    };
  });
}

/**
 * Get default time list
 * @param {string} format - '12h' or '24h' (default: '24h')
 * @param {string} view - 'detailed' or 'compact' (default: 'detailed')
 * @returns {string} Formatted multi-line string with default timezones
 */
function getDefaultTimeList(format = '24h', view = 'detailed') {
  return generateTimeList(DEFAULT_TIME_ZONES, format, view);
}

/**
 * Look up timezone info by city name
 * @param {string} city - City name (case-insensitive)
 * @returns {Object|null} { label, zone } or null if not found
 */
function lookupCity(city) {
  const normalized = city.toLowerCase().trim();
  return CITY_TIMEZONE_MAP[normalized] || null;
}

/**
 * Search cities by partial name for autocomplete
 * @param {string} query - Partial city name to search for
 * @param {number} limit - Maximum number of results (default: 25)
 * @returns {Array} Array of { name, label, zone } objects
 */
function searchCities(query, limit = 25) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    // Return popular cities when no query
    const popular = ["tokyo", "new york", "london", "paris", "dubai", "singapore", "sydney", "mumbai", "los angeles", "hong kong"];
    return popular.map(name => ({
      name: name,
      label: CITY_TIMEZONE_MAP[name].label,
      zone: CITY_TIMEZONE_MAP[name].zone
    })).slice(0, limit);
  }

  const results = [];
  for (const [name, info] of Object.entries(CITY_TIMEZONE_MAP)) {
    if (name.includes(normalized) || info.label.toLowerCase().includes(normalized)) {
      results.push({ name, label: info.label, zone: info.zone });
      if (results.length >= limit) break;
    }
  }
  return results;
}

/**
 * Get list of all available cities
 * @returns {Array} Array of city names
 */
function getAvailableCities() {
  return Object.keys(CITY_TIMEZONE_MAP).sort();
}

/**
 * Convert a time from one timezone to another
 * @param {string} timeStr - Time string (e.g., "3:00 PM" or "15:00")
 * @param {string} fromZone - Source timezone
 * @param {string} toZone - Target timezone
 * @param {string} format - Output format '12h' or '24h'
 * @returns {Object} { fromTime, toTime, fromDate, toDate, indicator }
 */
function convertTime(timeStr, fromZone, toZone, format = '24h') {
  // Parse the input time - try both formats
  let parsedTime;
  const today = DateTime.now().setZone(fromZone);

  // Try 12h format first
  let match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]) || 0;
    const meridiem = match[4]?.toLowerCase();

    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    parsedTime = today.set({ hour: hours, minute: minutes, second: seconds });
  } else {
    return null;
  }

  const converted = parsedTime.setZone(toZone);
  const timeFormat = format === '12h' ? "h:mm a" : "HH:mm";

  return {
    fromTime: parsedTime.toFormat(timeFormat),
    toTime: converted.toFormat(timeFormat),
    fromDate: parsedTime.toFormat("ccc, LLL d"),
    toDate: converted.toFormat("ccc, LLL d"),
    indicator: getDayNightIndicator(converted.hour),
    sameDay: parsedTime.toFormat("yyyy-MM-dd") === converted.toFormat("yyyy-MM-dd")
  };
}

/**
 * Get countdown to a specific time in a timezone
 * @param {string} timeStr - Target time (e.g., "3:00 PM")
 * @param {string} zone - Timezone
 * @returns {Object} { hours, minutes, seconds, isPast, targetTime }
 */
function getCountdown(timeStr, zone) {
  const now = DateTime.now().setZone(zone);

  let match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]) || 0;
  const meridiem = match[4]?.toLowerCase();

  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  let target = now.set({ hour: hours, minute: minutes, second: seconds });

  // If target is in the past, move to tomorrow
  if (target < now) {
    target = target.plus({ days: 1 });
  }

  const diff = target.diff(now, ['hours', 'minutes', 'seconds']);

  return {
    hours: Math.floor(diff.hours),
    minutes: Math.floor(diff.minutes),
    seconds: Math.floor(diff.seconds),
    targetTime: target.toFormat("h:mm a"),
    targetDate: target.toFormat("ccc, LLL d"),
    isPast: false
  };
}

/**
 * Format a scheduled time across multiple timezones
 * @param {string} timeStr - Time string
 * @param {string} sourceZone - Source timezone
 * @param {Array} entries - Array of { label, zone } to show
 * @param {string} format - '12h' or '24h'
 * @returns {Array} Array of formatted time entries
 */
function formatScheduledTime(timeStr, sourceZone, entries, format = '24h') {
  const results = [];

  for (const entry of entries) {
    const converted = convertTime(timeStr, sourceZone, entry.zone, format);
    if (converted) {
      results.push({
        label: entry.label,
        zone: entry.zone,
        time: converted.toTime,
        date: converted.toDate,
        indicator: converted.indicator,
        sameDay: converted.sameDay
      });
    }
  }

  return results;
}

/**
 * Format an event time across multiple timezones (for chart-linked events)
 * @param {Date|string} eventTime - Event time as Date or ISO string
 * @param {string} sourceZone - Source timezone of the event
 * @param {Array} entries - Array of { label, zone } chart entries
 * @param {string} format - '12h' or '24h'
 * @returns {string} Formatted multi-line string showing event in all timezones
 */
function formatEventForMultipleTimezones(eventTime, sourceZone, entries, format = '24h') {
  const source = DateTime.fromISO(eventTime.toString()).setZone(sourceZone);
  const sourceDate = source.startOf('day');
  const timeFormat = format === '12h' ? "h:mm a" : "HH:mm";

  const lines = [];

  for (const entry of entries) {
    const converted = source.setZone(entry.zone);
    const convertedDate = converted.startOf('day');
    const dayDiff = Math.round(convertedDate.diff(sourceDate, 'days').days);

    const timeStr = converted.toFormat(timeFormat);
    const indicator = getDayNightIndicator(converted.hour);

    // Show day offset if different day
    let dayLabel = '';
    if (dayDiff > 0) dayLabel = ` (+${dayDiff})`;
    else if (dayDiff < 0) dayLabel = ` (${dayDiff})`;

    lines.push(`${indicator} ${entry.label}: \`${timeStr}\`${dayLabel}`);
  }

  return lines.join('\n');
}

module.exports = {
  DEFAULT_TIME_ZONES,
  CITY_TIMEZONE_MAP,
  formatTimeEntry,
  formatTimeEntryCompact,
  generateTimeList,
  generateInlineFields,
  getDefaultTimeList,
  getDayNightIndicator,
  lookupCity,
  getAvailableCities,
  searchCities,
  convertTime,
  getCountdown,
  formatScheduledTime,
  formatEventForMultipleTimezones,
};
