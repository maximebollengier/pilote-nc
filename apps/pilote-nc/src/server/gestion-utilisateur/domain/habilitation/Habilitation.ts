import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import Droit from "@/server/droits/domain/Droit.interface";
import { estAutorise } from "@/server/droits/domain/estAutorise";
import {
  EntiteScopeeParSecteur,
  Habilitations,
} from "./Habilitation.interface";

const MESSAGE_PAR_DEFAUT = "Vous n'êtes pas autorisé à effectuer cette action";

export default class Habilitation {
  constructor(private readonly dependencies: Habilitations) {}

  private aLeSecteur(entite: EntiteScopeeParSecteur): boolean {
    return this.dependencies.habilitationsSecteur.includes(entite.secteurId);
  }

  verifierAutorisationCreationSecteur() {
    this.verifierProfil([ProfilEnum.ADMIN_OUTIL]);
  }

  verifierAutorisationCreationDirection() {
    this.verifierProfil([ProfilEnum.ADMIN_OUTIL]);
  }

  verifierAutorisationCreationMesure() {
    this.verifierProfil([ProfilEnum.ADMIN_OUTIL]);
  }

  /**
   * L'éligibilité du profil vient de la matrice de droits configurable
   * (page Admin > Droits — cf. estAutorise()). DIRECTION_NC reste, quel que
   * soit le réglage, restreint aux mesures de ses secteurs habilités : ce
   * n'est pas une case de la matrice, c'est une règle structurelle.
   */
  verifierAutorisationCreationAction(
    mesure: EntiteScopeeParSecteur,
    droits: Droit[],
  ) {
    const { profil } = this.dependencies;

    if (!estAutorise(droits, "ACTION_CREER", profil)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
    if (profil === ProfilEnum.DIRECTION_NC && !this.aLeSecteur(mesure)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
  }

  verifierAutorisationCreationIndicateur() {
    this.verifierProfil([ProfilEnum.ADMIN_OUTIL]);
  }

  verifierAutorisationCreationUtilisateur() {
    this.verifierProfil([ProfilEnum.ADMIN_OUTIL]);
  }

  /**
   * Couvre la saisie d'avancement, la modification des dates
   * prévisionnelles et le blocage/déblocage d'une action — mêmes règles
   * d'éligibilité que `verifierAutorisationCreationAction` (matrice de
   * droits + scoping secteur pour DIRECTION_NC).
   */
  verifierAutorisationModificationAction(
    action: EntiteScopeeParSecteur,
    droits: Droit[],
  ) {
    const { profil } = this.dependencies;

    if (!estAutorise(droits, "ACTION_MODIFIER", profil)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
    if (profil === ProfilEnum.DIRECTION_NC && !this.aLeSecteur(action)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
  }

  /**
   * Mêmes règles d'éligibilité que `verifierAutorisationCreationAction`
   * (matrice de droits + scoping secteur pour DIRECTION_NC).
   */
  verifierAutorisationSuppressionAction(
    action: EntiteScopeeParSecteur,
    droits: Droit[],
  ) {
    const { profil } = this.dependencies;

    if (!estAutorise(droits, "ACTION_SUPPRIMER", profil)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
    if (profil === ProfilEnum.DIRECTION_NC && !this.aLeSecteur(action)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
  }

  verifierAutorisationSoumissionPva(indicateur: EntiteScopeeParSecteur) {
    if (
      this.dependencies.profil !== ProfilEnum.DIRECTION_NC ||
      !this.aLeSecteur(indicateur)
    ) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
  }

  verifierAutorisationDecisionPva() {
    this.verifierProfil([ProfilEnum.SECRETARIAT_GENERAL]);
  }

  verifierAutorisationLectureMesure(mesure: EntiteScopeeParSecteur) {
    if (!this.peutLireMesure(mesure)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
  }

  /**
   * Version non levante de `verifierAutorisationLectureMesure`, utilisée pour
   * filtrer une liste de mesures plutôt que de vérifier une entité unique.
   */
  peutLireMesure(mesure: EntiteScopeeParSecteur): boolean {
    const { profil, transparenceGlobale } = this.dependencies;

    if (
      profil === ProfilEnum.PRESIDENT ||
      profil === ProfilEnum.SECRETARIAT_GENERAL ||
      profil === ProfilEnum.ADMIN_OUTIL
    ) {
      return true;
    }

    if (profil === ProfilEnum.MEMBRE_GOUVERNEMENT) {
      return transparenceGlobale || this.aLeSecteur(mesure);
    }

    if (profil === ProfilEnum.DIRECTION_NC) {
      return this.aLeSecteur(mesure);
    }

    return false;
  }

  private verifierProfil(profilsAutorises: ProfilEnum[]) {
    if (!profilsAutorises.includes(this.dependencies.profil)) {
      throw new UnauthorizedError(MESSAGE_PAR_DEFAUT);
    }
  }
}
