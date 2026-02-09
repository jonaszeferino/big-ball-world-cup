export const countryFlags: Record<string, string> = {
  // América do Sul
  "Argentina": "🇦🇷",
  "Brasil": "🇧🇷",
  "Uruguai": "🇺🇾",
  "Paraguai": "🇵🇾",
  "Chile": "🇨🇱",
  "Colômbia": "🇨🇴",
  "Equador": "🇪🇨",
  "Peru": "🇵🇪",
  "Venezuela": "🇻🇪",
  "Bolívia": "🇧🇴",

  
  // América do Norte e Central
  "México": "🇲🇽",
  "Estados Unidos da América": "🇺🇸",
  "EUA": "🇺🇸",
  "Canadá": "🇨🇦",
  "Costa Rica": "🇨🇷",
  "Jamaica": "🇯🇲",
  "Panamá": "🇵🇦",
  "Honduras": "🇭🇳",
  "El Salvador": "🇸🇻",
  "Guatemala": "🇬🇹",
  "Trinidad e Tobago": "🇹🇹",
  "Haiti": "🇭🇹",
  "Curaçao": "🇨🇼",
  
  // Europa
  "Alemanha": "🇩🇪",
  "Espanha": "🇪🇸",
  "França": "🇫🇷",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Itália": "🇮🇹",
  "Portugal": "🇵🇹",
  "Holanda": "🇳🇱",
  "Países Baixos": "🇳🇱",
  "Bélgica": "🇧🇪",
  "Croácia": "🇭🇷",
  "Dinamarca": "🇩🇰",
  "Suíca": "🇨🇭",
  "Austria": "🇦🇹",
  "Polônia": "🇵🇱",
  "Suécia": "🇸🇪",
  "Ucrânia": "🇺🇦",
  "Sérvia": "🇷🇸",
  "República Tcheca": "🇨🇿",
  "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "País de Gales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Noruega": "🇳🇴",
  "Turquia": "🇹🇷",
  "Grécia": "🇬🇷",
  "Rússia": "🇷🇺",
  
  // África
  "Marrocos": "🇲🇦",
  "Senegal": "🇸🇳",
  "Nigéria": "🇳🇬",
  "Tunísia": "🇹🇳",
  "Argélia": "🇩🇿",
  "Camarões": "🇨🇲",
  "Gana": "🇬🇭",
  "Costa do Marfin": "🇨🇮",
  "Mali": "🇲🇱",
  "Burkina Faso": "🇧🇫",
  "África do Sul": "🇿🇦",
  "Egito": "🇪🇬",
  "Cabo Verde": "🇨🇻",
  
  // Ásia
  "Japão": "🇯🇵",
  "Coréia do Sul": "🇰🇷",
  "Irã": "🇮🇷",
  "Arábia Saudita": "🇸🇦",
  "Austrália": "🇦🇺",
  "Catar": "🇶🇦",
  "Iraque": "🇮🇶",
  "Emirados Árabes": "🇦🇪",
  "China": "🇨🇳",
  "Tailândia": "🇹🇭",
  "Vietnã": "🇻🇳",
  "Uzbequistão": "🇺🇿",
  "Jordânia": "🇯🇴",
  
  // Oceania
  "Nova Zelândia": "🇳🇿",
}

export function getCountryFlag(countryName: string): string {
  return countryFlags[countryName] || "🏳️"
}
