import Team from '../models/Team';
import Game from '../models/Game';
import FlagColorRomHandler from '../models/FlagColorRomHandler';
import FlagDesignRomHandler from '../handlers/FlagDesignRomHandler';
import TeamNameTextRomHandler from '../handlers/texts/TeamNameTextRomHandler';
import TeamNameTilesRomHandler from '../handlers/TeamNameTilesRomHandler';
import PlayerNameRomHandler from '../handlers/texts/PlayerNameRomHandler';
import PlayerNumberRomHandler from '../handlers/texts/PlayerNumberRomHandler';
import PlayerColorRomHandler from '../handlers/texts/PlayerColorRomHandler';
import HairStyleRomHandler from '../handlers/texts/HairStyleRomHandler';
import { Color as FlagColor } from '../models/tiles/FlagDesign';
import { Color as NameColor } from '../models/tiles/TeamNameTiles';
import { decompress, tiles } from './binary.mjs';
import { DELUXE_TEAMS, readDeluxeTeam } from './deluxe.mjs';

export function teamNames(game) {
  return game === 'issd' ? DELUXE_TEAMS : Object.values(Team.getTeams());
}

export async function readTeam({ rom, game }, index) {
  if (game === 'issd') return readDeluxeTeam(rom, index);
  const team = new Team(teamNames(game)[index]);
  if (!team.name) throw new Error('Equipo inválido.');
  const decode = offset => decompress(rom, Number(offset));
  const flag = (await new FlagDesignRomHandler(rom, decode).readFromRomAt(team)).getMatrix();
  const rgb = new FlagColorRomHandler(rom, Game.ISS).readFromRomAt(team).getRgbs()[0];
  const names = new PlayerNameRomHandler(rom).readFromRomAt(team);
  const numbers = new PlayerNumberRomHandler(rom).readFromRomAt(team);
  const colors = new PlayerColorRomHandler(rom).readFromRomAt(team);
  const hair = new HairStyleRomHandler(rom).readFromRomAt(team);
  const nameOffset = new TeamNameTilesRomHandler(rom, decode).readPointerAt(team);
  const teamMatrix = tiles(decode(nameOffset), 2, 4);
  const flagColors = new Array(16).fill('transparent');
  Object.entries(FlagColor.getColors()).forEach(([key, value]) => { if (rgb[key]) flagColors[value] = rgb[key].toHex(); });
  return {
    name: new TeamNameTextRomHandler(rom).readFromRomAt(team).toString(),
    flag: flag.map(row => row.map(key => FlagColor.getColors()[key] ?? 0)),
    colors: flagColors,
    teamMatrix,
    teamColors: [0, 1, 2, 3].map(code => new NameColor(code).toHex()),
    players: names.map((name, i) => ({ name, no: numbers[i], color: colors[i], hair: hair[i].text })),
  };
}
