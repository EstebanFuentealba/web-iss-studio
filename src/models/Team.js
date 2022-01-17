export default class Team {
  static GERMANY = "Germany";
  static ITALY = "Italy";
  static HOLLAND = "Holland";
  static SPAIN = "Spain";
  static ENGLAND = "England";
  static SCOTLAND = "Scotland";
  static WALES = "Wales";
  static FRANCE = "France";
  static DENMARK = "Denmark";
  static SWEDEN = "Sweden";
  static NORWAY = "Norway";
  static IRELAND = "Ireland";
  static BELGIUM = "Belgium";
  static AUSTRIA = "Austria";
  static SWISS = "Swiss";
  static ROMANIA = "Romania";
  static BULGARIA = "Bulgaria";
  static RUSSIA = "Russia";
  static ARGENTINA = "Argentina";
  static BRAZIL = "Brazil";
  static COLOMBIA = "Colombia";
  static MEXICO = "Mexico";
  static USA = "U.S.A.";
  static NIGERIA = "Nigeria";
  static CAMEROON = "Cameroon";
  static SKOREA = "S.Korea";
  static SUPERSTAR = "Super Star";

  static PORTUGAL = "Portugal";
  static GREECE = "Greece";
  static CROATIA = "Croatia";
  static IRELANDN = "Ireland del Norte";
  static CZECH = "Republica Checa";
  static POLAND = "Polonia";
  static JAPAN = "Japon";
  static TURKEY = "Turquia";
  static MOROCCO = "Marruecos";
  static URUGUAY = "Uruguay";
  constructor(name) {
    this.name = name;
  }
  static getTeams() {
    return {
      GERMANY: Team.GERMANY,
      ITALY: Team.ITALY,
      HOLLAND: Team.HOLLAND,
      SPAIN: Team.SPAIN,
      ENGLAND: Team.ENGLAND,
      SCOTLAND: Team.SCOTLAND,
      WALES: Team.WALES,
      FRANCE: Team.FRANCE,
      DENMARK: Team.DENMARK,
      SWEDEN: Team.SWEDEN,
      NORWAY: Team.NORWAY,
      IRELAND: Team.IRELAND,
      BELGIUM: Team.BELGIUM,
      AUSTRIA: Team.AUSTRIA,
      SWISS: Team.SWISS,
      ROMANIA: Team.ROMANIA,
      BULGARIA: Team.BULGARIA,
      RUSSIA: Team.RUSSIA,
      ARGENTINA: Team.ARGENTINA,
      BRAZIL: Team.BRAZIL,
      COLOMBIA: Team.COLOMBIA,
      MEXICO: Team.MEXICO,
      USA: Team.USA,
      NIGERIA: Team.NIGERIA,
      CAMEROON: Team.CAMEROON,
      SKOREA: Team.SKOREA,
      SUPERSTAR: Team.SUPERSTAR,
    };
  }
  // getKey() {
  //   return  Object.keys( Team.getTeams())[this.ordinal()]
  // }
  toString() {
    return String(this.ordinal()).padStart(2, "0") + ". " + this.name;
  }
  ordinal() {
    return Object.values(Team.getTeams()).indexOf(this.name);
  }
  getKey() {
    return Object.keys(Team.getTeams())[this.ordinal()]
  }
  
  next() {
    let teams = Team.getTeams();
    let keys = Object.keys( teams);
      return new Team(teams[keys[(this.ordinal() + 1) % keys.length]]);
  }

  
  previous() {
    let teams = Team.getTeams();
    let keys = Object.keys( teams);
      return new Team(teams[keys[(this.ordinal() + keys.length-1) % keys.length]]);
  }
}
