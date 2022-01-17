import SizedAddress from "../../models/SizedAddress";
import Team from "../../models/Team";
import TeamNameText from "../../models/TeamNameText";
import { PointerFormat, readPointer } from "../../utils";

export default class TeamNameTextRomHandler {
    static POINTER_OFFSET = 0x39DAE;
    static POINTER_STEP = 2;
    static maximumAddress = 0x44486;
    constructor(rom) {
        this.rom = rom;
    }
    readFromRom() {
        let map = new Map();
        for (let key in Team.getTeams()) {
            let team = new Team(Team.getTeams()[key]);
            map.set(team.name, this.readFromRomAt(team));
        }
        return map;
    }
    readFromRomAt(team) {
        let offset = this.readPointerAt(team);
        let length = this.rom.slice(offset, offset+1)[0] * 4;
        let data = this.rom.slice(offset, offset + length + 1);
        console.log(team + " name text on address " + (offset).toString(16));
        return TeamNameText.deserialize(data);
    }
    pointerFormat() {
        return PointerFormat.P40000;
    }
    readPointerAt(team) {
        return readPointer(this.rom, this.pointerOffset(team), this.pointerFormat());
    }
    pointerOffset(team) {
        return TeamNameTextRomHandler.POINTER_OFFSET + TeamNameTextRomHandler.POINTER_STEP * team.ordinal();
    }
    readAddressMap() {
        let map = new Map();
        for (let key in Team.getTeams()) {
            let team = new Team(Team.getTeams()[key]);
            let offset = this.pointerOffset(team);
            let address = readPointer(this.rom, offset, this.pointerFormat());
            let size = this.rom.slice(address, address + 1)[0]*4 + 1;
            map.set(team, new SizedAddress(address, size));
        }
        return map;
    }
    invert(addressMap) {
        let map = new Map();
        for (let key in [...addressMap.keys()]) {
            let team = [...addressMap.keys()][key];
            map.set(addressMap.get(team), team);
        }
        return map;
    }
}
/*
{
    SizedAddress{address=43ed5, size=41}=[17. Bulgaria],
 SizedAddress{address=43f16, size=35}=[26. S.Korea],
 SizedAddress{address=43f4b, size=29}=[07. Wales],
 SizedAddress{address=43f74, size=39}=[09. Denmark],
 SizedAddress{address=43fad, size=39}=[14. Austria],
 SizedAddress{address=43fe6, size=41}=[06. Scotland],
 SizedAddress{address=44027, size=39}=[01. Germany],
 SizedAddress{address=44060, size=2d}=[02. Italy],
 SizedAddress{address=4408d, size=39}=[03. Holland],
 SizedAddress{address=440c6, size=29}=[04. Spain],
 SizedAddress{address=440ef, size=39}=[13. Belgium],
 SizedAddress{address=44128, size=31}=[18. Russia],
 SizedAddress{address=44159, size=25}=[10. Sweden],
 SizedAddress{address=4417e, size=39}=[12. Ireland],
 SizedAddress{address=441b7, size=39}=[05. England],
 SizedAddress{address=441f0, size=31}=[08. France],
 SizedAddress{address=44221, size=41}=[21. Colombia],
 SizedAddress{address=44262, size=31}=[20. Brazil],
 SizedAddress{address=44293, size=49}=[19. Argentina],
 SizedAddress{address=442dc, size=39}=[16. Romania],
 SizedAddress{address=44315, size=31}=[22. Mexico],
 SizedAddress{address=44346, size=39}=[24. Nigeria],
 SizedAddress{address=4437f, size=41}=[25. Cameroon],
 SizedAddress{address=443c0, size=25}=[23. U.S.A.],
 SizedAddress{address=443e5, size=29}=[15. Switz],
 SizedAddress{address=4440e, size=25}=[11. Norway],
 SizedAddress{address=44433, size=49}=[27. Super Star]
 }
 */