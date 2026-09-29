import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import IndicateurImpact from "@/server/indicateurs-impact/domain/IndicateurImpact.interface";
import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";
import {
  calculerTauxRealisation,
  valeurCibleEstCoherenteAvecSensEvolution,
} from "@/server/indicateurs-impact/domain/calculerTauxRealisation";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

export default class ModifierIndicateurImpactUseCase {
  constructor(
    private readonly dependencies: {
      indicateurImpactRepository: IndicateurImpactRepository;
    },
  ) {}

  async run(input: {
    id: string;
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    auteurModificationId: string;
  }): Promise<IndicateurImpact> {
    if (!valeurCibleEstCoherenteAvecSensEvolution(input)) {
      throw new BadRequestError(
        input.sensEvolution === "A_LA_HAUSSE"
          ? "La valeur cible doit être supérieure à la valeur initiale pour un indicateur à la hausse"
          : "La valeur cible doit être inférieure à la valeur initiale pour un indicateur à la baisse",
      );
    }

    const existant = await this.dependencies.indicateurImpactRepository.récupérerParId(
      input.id,
    );
    if (!existant) throw new NotFoundError("Indicateur d'impact introuvable");

    // valeurInitiale/valeurCible/sensEvolution changent : le taux de
    // réalisation (qui en dépend) doit être recalculé, à valeurActuelle
    // inchangée — sans quoi il resterait périmé après la modification.
    const tauxRealisation = calculerTauxRealisation({
      valeurInitiale: input.valeurInitiale,
      valeurCible: input.valeurCible,
      valeurActuelle: existant.valeurActuelle,
      sensEvolution: input.sensEvolution,
    });

    return this.dependencies.indicateurImpactRepository.modifier({
      ...input,
      tauxRealisation,
    });
  }
}
