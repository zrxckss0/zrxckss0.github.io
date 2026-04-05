import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const outputDir = path.join(repoRoot, "data")
const outputFile = path.join(outputDir, "roblox-games.json")

const GAMES = [
  {
    universeId: 2092410051,
    placeId: 5865858426,
    href: "https://www.roblox.com/games/5865858426/Retail-Tycoon-2",
    displayName: "Retail Tycoon 2"
  },
  {
    universeId: 7428819247,
    placeId: 114478751418135,
    href: "https://www.roblox.com/games/114478751418135/South-London-Remastered",
    displayName: "South London Remastered"
  },
  {
    universeId: 9047190101,
    placeId: 101716225967171,
    href: "https://www.roblox.com/games/101716225967171/Oxfordshire-County-Beta",
    displayName: "Oxfordshire County Beta"
  },
  {
    universeId: 586304564,
    placeId: 1486528523,
    href: "https://www.roblox.com/games/1486528523/RCPD-FR",
    displayName: "RCPD:FR"
  },
  {
    universeId: 7241681846,
    placeId: 88729483564766,
    href: "https://www.roblox.com/games/88729483564766/MONEYCALL",
    displayName: "MONEYCALL"
  },
  {
    universeId: 2201173838,
    placeId: 6068707488,
    href: "https://www.roblox.com/games/6068707488/Navy-Simulator",
    displayName: "Navy Simulator"
  },
  {
    universeId: 4688177962,
    placeId: 13476966119,
    href: "https://www.roblox.com/games/13476966119/Buckingham-Palace",
    displayName: "Buckingham Palace"
  },
  {
    universeId: 3170483284,
    placeId: 8265622251,
    href: "https://www.roblox.com/games/8265622251/Croydon-London-Bus-Simulator",
    displayName: "Croydon: London Bus Simulator"
  }
]

async function fetchJson(url){
  const response = await fetch(url, {
    headers: {
      "User-Agent": "zrxckss0.github.io roblox games updater"
    }
  })

  if (!response.ok){
    throw new Error(`Request failed for ${url} with ${response.status}`)
  }

  return response.json()
}

async function main(){
  const universeIds = GAMES.map((game) => game.universeId).join(",")

  const [statsPayload, thumbnailsPayload] = await Promise.all([
    fetchJson(`https://games.roblox.com/v1/games?universeIds=${universeIds}`),
    fetchJson(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`)
  ])

  const statsByUniverse = new Map((statsPayload.data || []).map((item) => [Number(item.id), item]))
  const thumbnailsByUniverse = new Map(
    (thumbnailsPayload.data || []).map((item) => [Number(item.universeId), item.thumbnails?.[0]?.imageUrl || ""])
  )

  const games = GAMES.map((game) => {
    const stats = statsByUniverse.get(game.universeId)
    if (!stats){
      throw new Error(`Missing stats for universe ${game.universeId}`)
    }

    return {
      universeId: game.universeId,
      placeId: game.placeId,
      href: game.href,
      displayName: game.displayName,
      name: stats.name,
      creatorName: stats.creator?.name || "Roblox",
      playing: Number(stats.playing || 0),
      visits: Number(stats.visits || 0),
      maxPlayers: Number(stats.maxPlayers || 0),
      thumbnailUrl: thumbnailsByUniverse.get(game.universeId) || "",
      updated: stats.updated || null
    }
  })

  const payload = {
    updatedAt: new Date().toISOString(),
    games
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
