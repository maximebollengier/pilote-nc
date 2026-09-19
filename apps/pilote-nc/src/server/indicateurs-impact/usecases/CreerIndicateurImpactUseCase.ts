import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import IndicateurImpact from "@/server/indicateurs-impact/domain/IndicateurImpact.interface";
import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";
import { valeurCibleEstCoherenteAvecSensEvolution } from "@/server/indicateurs-impact/domain/calculerTauxRealisation";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

export default class CreerIndicateurImpactUseCase {
  constructor(
    private readonly dependencies: {
      indicateurImpactRepository: IndicateurImpactRepository;
    },
  ) {}

  async run(input: {
    mesureId: string;
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    auteurCreationId: string;
  }): Promise<IndicateurImpact> {
    if (!valeurCibleEstCoherenteAvecSensEvolution(input)) {
      throw new BadRequestError(
        input.sensEvolution === "A_LA_HAUSSE"
          ? "La valeur cible doit être supérieure à la valeur initiale pour un indicateur à la hausse"
          : "La valeur cible doit être inférieure à la valeur initiale pour un indicateur à la baisse",
      );
    }

    return this.dependencies.indicateurImpactRepository.créer(input);
  }
}
