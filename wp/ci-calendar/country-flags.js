/**
 * European country name to flag emoji mapping.
 * Includes English, German (Deutsch), and Danish (Dansk) names.
 *
 * Note: Denmark/Danmark/Dänemark is intentionally excluded — the caller handles that case.
 */

(function () {
  const countryFlagMap = {
    // Albania
    "albania": "🇦🇱",
    "albanien": "🇦🇱",    // German & Danish share this

    // Andorra
    "andorra": "🇦🇩",     // same in all three languages

    // Austria
    "austria": "🇦🇹",
    "österreich": "🇦🇹",  // German
    "østrig": "🇦🇹",      // Danish

    // Belarus
    "belarus": "🇧🇾",
    "weißrussland": "🇧🇾", // German
    "hviderusland": "🇧🇾", // Danish

    // Belgium
    "belgium": "🇧🇪",
    "belgien": "🇧🇪",     // German & Danish share this
    "belgië": "🇧🇪",      // alternative

    // Bosnia and Herzegovina
    "bosnia and herzegovina": "🇧🇦",
    "bosnien und herzegowina": "🇧🇦", // German
    "bosnien-hercegovina": "🇧🇦",     // Danish
    "bosnia": "🇧🇦",
    "herzegowina": "🇧🇦",
    "herzegovina": "🇧🇦",

    // Bulgaria
    "bulgaria": "🇧🇬",
    "bulgarien": "🇧🇬",   // German & Danish share this

    // Croatia
    "croatia": "🇭🇷",
    "kroatien": "🇭🇷",    // German & Danish share this

    // Cyprus
    "cyprus": "🇨🇾",
    "zypern": "🇨🇾",      // German
    "cypern": "🇨🇾",      // Danish

    // Czech Republic / Czechia
    "czech republic": "🇨🇿",
    "czechia": "🇨🇿",
    "tschechien": "🇨🇿",  // German
    "tschechische republik": "🇨🇿", // German formal
    "tjekkiet": "🇨🇿",    // Danish
    "den tjekkiske republik": "🇨🇿", // Danish formal

    // Estonia
    "estonia": "🇪🇪",
    "estland": "🇪🇪",     // German & Danish share this

    // Finland
    "finland": "🇫🇮",
    "finnland": "🇫🇮",    // German

    // France
    "france": "🇫🇷",
    "frankreich": "🇫🇷",  // German
    "frankrig": "🇫🇷",    // Danish

    // Germany
    "germany": "🇩🇪",
    "deutschland": "🇩🇪", // German
    "tyskland": "🇩🇪",    // Danish

    // Greece
    "greece": "🇬🇷",
    "griechenland": "🇬🇷", // German
    "grækenland": "🇬🇷",   // Danish

    // Hungary
    "hungary": "🇭🇺",
    "ungarn": "🇭🇺",      // German & Danish share this

    // Iceland
    "iceland": "🇮🇸",
    "island": "🇮🇸",      // German & Danish share this

    // Ireland
    "ireland": "🇮🇪",
    "irland": "🇮🇪",      // German & Danish share this

    // Italy
    "italy": "🇮🇹",
    "italien": "🇮🇹",     // German & Danish share this

    // Kosovo
    "kosovo": "🇽🇰",      // same in all three languages

    // Latvia
    "latvia": "🇱🇻",
    "lettland": "🇱🇻",    // German & Danish share this

    // Liechtenstein
    "liechtenstein": "🇱🇮", // same in all three languages

    // Lithuania
    "lithuania": "🇱🇹",
    "litauen": "🇱🇹",     // German & Danish share this

    // Luxembourg
    "luxembourg": "🇱🇺",
    "luxemburg": "🇱🇺",   // German & Danish share this

    // Malta
    "malta": "🇲🇹",       // same in all three languages

    // Moldova
    "moldova": "🇲🇩",
    "moldau": "🇲🇩",      // German
    "moldavien": "🇲🇩",   // Danish

    // Monaco
    "monaco": "🇲🇨",      // same in all three languages

    // Montenegro
    "montenegro": "🇲🇪",
    "crna gora": "🇲🇪",
    "montenegró": "🇲🇪",

    // Netherlands
    "netherlands": "🇳🇱",
    "the netherlands": "🇳🇱",
    "niederlande": "🇳🇱",  // German
    "holland": "🇳🇱",      // colloquial, all languages
    "nederland": "🇳🇱",
    "nederlandene": "🇳🇱", // Danish

    // North Macedonia
    "north macedonia": "🇲🇰",
    "nordmazedonien": "🇲🇰", // German
    "nordmakedonien": "🇲🇰", // Danish
    "macedonia": "🇲🇰",
    "mazedonien": "🇲🇰",    // German
    "makedonien": "🇲🇰",    // Danish

    // Norway
    "norway": "🇳🇴",
    "norwegen": "🇳🇴",     // German
    "norge": "🇳🇴",        // Danish (and Norwegian)

    // Poland
    "poland": "🇵🇱",
    "polen": "🇵🇱",        // German & Danish share this

    // Portugal
    "portugal": "🇵🇹",     // same in all three languages

    // Romania
    "romania": "🇷🇴",
    "rumänien": "🇷🇴",     // German
    "rumænien": "🇷🇴",     // Danish

    // Russia
    "russia": "🇷🇺",
    "russland": "🇷🇺",     // German & Danish share this
    "russische föderation": "🇷🇺", // German formal

    // San Marino
    "san marino": "🇸🇲",   // same in all three languages

    // Serbia
    "serbia": "🇷🇸",
    "serbien": "🇷🇸",      // German & Danish share this

    // Slovakia
    "slovakia": "🇸🇰",
    "slowakei": "🇸🇰",     // German
    "slovakiet": "🇸🇰",    // Danish

    // Slovenia
    "slovenia": "🇸🇮",
    "slowenien": "🇸🇮",    // German
    "slovenien": "🇸🇮",    // Danish

    // Spain
    "spain": "🇪🇸",
    "spanien": "🇪🇸",      // German & Danish share this
    "españa": "🇪🇸",       // native

    // Sweden
    "sweden": "🇸🇪",
    "schweden": "🇸🇪",     // German
    "sverige": "🇸🇪",      // Danish (and Swedish)

    // Switzerland
    "switzerland": "🇨🇭",
    "schweiz": "🇨🇭",      // German
    "schweitz": "🇨🇭",     // common misspelling
    "svejts": "🇨🇭",       // Danish
    "die schweiz": "🇨🇭",

    // Turkey
    "turkey": "🇹🇷",
    "türkiye": "🇹🇷",      // native/official
    "türkei": "🇹🇷",       // German
    "tyrkiet": "🇹🇷",      // Danish

    // Ukraine
    "ukraine": "🇺🇦",
    "ukraina": "🇺🇦",      // Danish variant

    // United Kingdom / England / Scotland / Wales
    "united kingdom": "🇬🇧",
    "uk": "🇬🇧",
    "great britain": "🇬🇧",
    "britain": "🇬🇧",
    "england": "🇬🇧",
    "scotland": "🇬🇧",
    "wales": "🇬🇧",
    "vereinigtes königreich": "🇬🇧", // German
    "großbritannien": "🇬🇧",         // German
    "det forenede kongerige": "🇬🇧", // Danish
    "storbritannien": "🇬🇧",         // Danish

    // Vatican City
    "vatican city": "🇻🇦",
    "vatican": "🇻🇦",
    "vatikanstadt": "🇻🇦", // German
    "vatikanstaten": "🇻🇦", // Danish
    "holy see": "🇻🇦",
    "heiliger stuhl": "🇻🇦", // German
    "den hellige stol": "🇻🇦", // Danish
  };

  /**
   * Given a full location string, searches for any known European country name
   * (case-insensitive) and returns the corresponding flag emoji.
   *
   * Note: Denmark/Danmark/Dänemark is intentionally excluded — the caller handles that case.
   *
   * @param {string} locationString - A location string, e.g. "Berlin, Germany"
   * @returns {string} Flag emoji, or empty string if no match found
   */
  function countryFlag(locationString) {
    if (!locationString || typeof locationString !== "string") {
      return "";
    }

    const lower = locationString.toLowerCase();

    for (const name in countryFlagMap) {
      if (lower.includes(name)) {
        return countryFlagMap[name];
      }
    }

    return "";
  }

  // Export as a global function
  window.countryFlag = countryFlag;
})();
