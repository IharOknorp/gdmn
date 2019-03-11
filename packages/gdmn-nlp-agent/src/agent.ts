import {
  hasMeaning,
  morphAnalyzer,
  Noun,
  NounLexeme,
  PrepositionType,
  RusAdjectiveCategory,
  RusAdjectiveLexeme,
  RusANP,
  RusCase,
  RusHmNouns,
  RusImperativeVP,
  RusNNP,
  RusNoun,
  RusPhrase,
  RusPP,
  RusPrepositionLexeme,
  RusVerb,
  SemCategory,
  SemContext,
  RusPTimeP
} from "gdmn-nlp";
import {
  Entity,
  EntityAttribute,
  EntityLink,
  EntityQuery,
  EntityQueryField,
  EntityQueryOptions,
  ERModel,
  IEntityQueryWhere,
  IEntityQueryWhereValue,
  ScalarAttribute
} from "gdmn-orm";
import {Action, ICommand} from "./command";
import { DateValue } from 'gdmn-nlp/dist/definitions/syntax/value';

export class ERTranslatorRU {

  readonly erModel: ERModel;
  readonly neMap: Map<NounLexeme, Entity[]>;

  constructor(erModel: ERModel) {
    this.erModel = erModel;
    this.neMap = new Map<NounLexeme, Entity[]>();

    Object.entries(this.erModel.entities).forEach(([, e]) =>
      e.lName.ru && e.lName.ru.name.split(",").forEach(n =>
        morphAnalyzer(n.trim()).forEach(w => {
          if (w instanceof Noun) {
            const entities = this.neMap.get(w.lexeme);
            if (!entities) {
              this.neMap.set(w.lexeme, [e]);
            } else {
              if (!entities.find(f => f === e)) {
                entities.push(e);
              }
            }
          }
        })
      )
    );
  }

  public process(phrase: RusPhrase): ICommand[] {
    if (phrase instanceof RusImperativeVP) {
      return this.processImperativeVP(phrase as RusImperativeVP);
    } else {
      throw new Error(`Unsupported phrase type`);
    }
  }

  public processImperativeVP(imperativeVP: RusImperativeVP): ICommand[] {
    const action = ((v: RusVerb): Action => {
      if (hasMeaning(SemContext.QueryDB, "показать", v)) {
        return "QUERY";
      }
      if (hasMeaning(SemContext.QueryDB, "удалить", v)) {
        return "DELETE";
      }
      throw new Error(`Unknown verb ${v.word}`);
    })(imperativeVP.imperativeVerb);

    if (!imperativeVP.imperativeNP) {
      throw new Error("teasd");
    }

    const np = imperativeVP.imperativeNP;

    const objectANP = (() => {
      if (np.noun instanceof RusANP) {
        return (np.noun as RusANP).noun;
      } else if (np.noun instanceof RusNNP) {
        return (np.noun as RusNNP).noun;
      } else {
        return np.noun;
      }
    })();

    const entities = this.neMap.get(objectANP.lexeme);

    if (!entities) {
      throw new Error(`Can't find entities for noun ${objectANP.word}`);
    }

    return entities.map(entity => {
      const fields = Object.values(entity.attributes)
        .filter(attr => attr instanceof ScalarAttribute)
        .map(attr => new EntityQueryField(attr));

      let options;
      let first: number | undefined;
      const or: IEntityQueryWhere[] = [];
      const equals: IEntityQueryWhereValue[] = [];
      if (np.noun instanceof RusANP) {
        const adjective = (np.noun as RusANP).adjf;
        if ((adjective.lexeme as RusAdjectiveLexeme).category === RusAdjectiveCategory.Rel) {
          const nounLexeme = (adjective.lexeme as RusAdjectiveLexeme).getNounLexeme();
          if (nounLexeme && nounLexeme.semCategories.find(sc => sc === SemCategory.Place)) {
            const attr = entity.attributesBySemCategory(SemCategory.ObjectLocation)[0];
            const words = nounLexeme.getWordForm({c: RusCase.Nomn, singular: true}).word;
            if (attr instanceof EntityAttribute) {
              const linkEntity = attr.entities[0];
              const linkAlias = "alias2";
              if (
                !fields
                  .filter((field) => field.links)
                  .some((field) =>
                    field.links!.some((fLink) => fLink.alias === linkAlias && field.attribute === attr))
              ) {
                fields.push(new EntityQueryField(attr, [new EntityLink(linkEntity, linkAlias, [])]));
              }

              const orEquals: IEntityQueryWhereValue[] = [];
              orEquals.push({
                alias: "alias2",
                attribute: linkEntity.attribute("NAME"),
                value: words
              });
              or.push({equals: orEquals});

            } else {
              equals.push({
                alias: "alias1",
                attribute: attr,
                value: words
              });
            }
          } else {
            throw new Error(`Can't find semantic category place for noun ${objectANP.word}`);
          }
        }
      }

      //const cn = (np.noun instanceof RusNNP) && ((np.noun as RusNNP).items[0] instanceof RusCN) ? (np.noun as RusNNP).items[0] as RusCN : undefined;
      //if (np.noun instanceof RusNNP) {
      //  const numeral = (np.noun as RusNNP).numr;
      //  if ((numeral.lexeme as RusNumeralLexeme).numeralValue === NumeralValue.Quantitative) {
      //    if (cn instanceof RusCN) {
      //      first = cn.items.map(item => {
      //        if (item instanceof RusNumeral) {
      //        return Number(item.lexeme.digitalWrite)
      //        }
      //      }).reduce( (res, curr) => {
      //        curr = (curr) ? curr : 0;
      //        res = (res) ? res : 0;
      //        const mid = (curr % 1000 === 0 && res % 1000 > 0) ? res % 1000 : 1;
      //        return ((res !== 0 && mid !== 1) ? (res - mid) : res) + mid * curr;
      //      }, 0)
      //    } else {
      //      first = Number((numeral.lexeme as RusNumeralLexeme).digitalWrite);
      //    }
      //  }
      //}

      if (np.items[1] instanceof RusPTimeP) {
        const pTimeP: RusPTimeP = np.items[1] as RusPTimeP;
        const attr = entity.attributesBySemCategory(SemCategory.Date)[0];
        if (attr instanceof EntityAttribute) {
          const linkEntity = attr.entities[0];
          const linkAlias = "alias2";
          if (
            !fields
              .filter((field) => field.links)
              .some((field) =>
                field.links!.some((fLink) => fLink.alias === linkAlias && field.attribute === attr))
          ) {
            fields.push(new EntityQueryField(attr, [new EntityLink(linkEntity, linkAlias, [])]));
          }

          const orEquals: IEntityQueryWhereValue[] = [];
          orEquals.push({
            alias: "alias2",
            attribute: linkEntity.attribute("Date"),
            value: (pTimeP.items[1] as DateValue).image
          });
          or.push({equals: orEquals});

        } else {
          equals.push({
            alias: "alias1",
            attribute: attr,
            value: (pTimeP.items[1] as DateValue).image
          });
        }
      }

      const hsm = (np.pp instanceof RusPP) && ((np.pp as RusPP).items[1] instanceof RusHmNouns) ? (np.pp as RusPP).items[1] as RusHmNouns : undefined;

      if (np.pp instanceof RusPP) {
        const preposition = (np.pp as RusPP).prep;
        if ((preposition.lexeme as RusPrepositionLexeme).prepositionType === PrepositionType.Place) {
          const nounLexeme = (np.pp as RusPP).noun.lexeme;
          if (nounLexeme && nounLexeme.semCategories.find(sc => sc === SemCategory.Place)) {
            const attr = entity.attributesBySemCategory(SemCategory.ObjectLocation)[0];
            if (hsm instanceof RusHmNouns) {
              hsm.items.map(item => {
                if (item instanceof RusNoun) {
                  const words = item.lexeme.getWordForm({c: RusCase.Nomn, singular: true}).word;
                  if (attr instanceof EntityAttribute) {
                    const linkEntity = attr.entities[0];
                    const linkAlias = "alias2";
                    if (
                      !fields
                        .filter((field) => field.links)
                        .some((field) =>
                          field.links!.some((fLink) => fLink.alias === linkAlias && field.attribute === attr))
                    ) {
                      fields.push(new EntityQueryField(attr, [new EntityLink(linkEntity, linkAlias, [])]));
                    }

                    const orEquals: IEntityQueryWhereValue[] = [];
                    orEquals.push({
                      alias: "alias2",
                      attribute: linkEntity.attribute("NAME"),
                      value: words
                    });
                    or.push({equals: orEquals});

                  } else {
                    equals.push({
                      alias: "alias1",
                      attribute: attr,
                      value: words
                    });
                  }
                }
              });
            } else {
              const words = nounLexeme.getWordForm({c: RusCase.Nomn, singular: true}).word;
              if (attr instanceof EntityAttribute) {
                const linkEntity = attr.entities[0];
                const linkAlias = "alias2";
                if (
                  !fields
                    .filter((field) => field.links)
                    .some((field) =>
                      field.links!.some((fLink) => fLink.alias === linkAlias && field.attribute === attr))
                ) {
                  fields.push(new EntityQueryField(attr, [new EntityLink(linkEntity, linkAlias, [])]));
                }

                const orEquals: IEntityQueryWhereValue[] = [];
                orEquals.push({
                  alias: "alias2",
                  attribute: linkEntity.attribute("NAME"),
                  value: words
                });
                or.push({equals: orEquals});

              } else {
                equals.push({
                  alias: "alias1",
                  attribute: attr,
                  value: words
                });
              }
            }
          }
        }
      }
      if (or.length !== 0) {
        options = new EntityQueryOptions(first, undefined, [{or: or}]);
      } else if (equals.length !== 0) {
        options = new EntityQueryOptions(first, undefined, [{equals}]);
      }

      const entityLink = new EntityLink(entity, "alias1", fields);
      return {
        action,
        payload: new EntityQuery(entityLink, options)
      };
    });
  }
}
