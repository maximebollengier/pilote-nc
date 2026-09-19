import Secteur from "@/server/secteurs/domain/Secteur.interface";

export default interface SecteurRepository {
  créer(donnees: {
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
    auteurCreationId: string;
  }): Promise<Secteur>;
  lister(): Promise<Secteur[]>;
  récupérerParId(id: string): Promise<Secteur | null>;
  modifier(donnees: {
    id: string;
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
    auteurModificationId: string;
  }): Promise<Secteur>;
  supprimer(donnees: { id: string; auteurModificationId: string }): Promise<void>;
}
