import { RusNumeralInterface, NumeralType, NumeralStructure, NumeralRank, RusGender } from "./types";

export const rusNumerals: RusNumeralInterface[] = [
  {
    stem: 'нол',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 0,
    declensionZ: 'pqs0',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'один',
    stem1: 'одн',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    gender: RusGender.Masc,
    value: 1,
    declensionZ: 'pqs1',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'один',
    stem1: 'одн',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    gender: RusGender.Femn,
    value: 1,
    declensionZ: 'pqs1',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'один',
    stem1: 'одн',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    gender: RusGender.Neut,
    value: 1,
    declensionZ: 'pqs1',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'дв',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    gender: RusGender.Masc,
    value: 2,
    declensionZ: 'pqs2',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'дв',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    gender: RusGender.Femn,
    value: 2,
    declensionZ: 'pqs2',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'дв',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    gender: RusGender.Neut,
    value: 2,
    declensionZ: 'pqs2',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'тр',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 3,
    declensionZ: 'pqs3',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'четыр',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 4,
    declensionZ: 'pqs4',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'пят',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 5,
    declensionZ: 'pqs5-7,9,10',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'шест',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 6,
    declensionZ: 'pqs5-7,9,10',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'сем',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 7,
    declensionZ: 'pqs5-7,9,10',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'восем',
    stem1: 'восьм',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 8,
    declensionZ: 'pqs8',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'девят',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 9,
    declensionZ: 'pqs5-7,9,10',
    rank: NumeralRank.ProperQuantitative,
  },
  {
    stem: 'десят',
    stem1: '',
    stem2: '',
    type: NumeralType.Cardinal,
    structure: NumeralStructure.Simple,
    value: 10,
    declensionZ: 'pqs5-7,9,10',
    rank: NumeralRank.ProperQuantitative,
  }
];