import Direction from "@/server/directions/domain/Direction.interface";

export default interface DirectionRepository {
  créer(donnees: {
    code: string;
    nom: string;
    secteurIds: string[];
    auteurCreationId: string;
  }): Promise<Direction>;
  lister(): Promise<Direction[]>;
  récupérerParId(id: string): Promise<Direction | null>;
  modifier(donnees: {
    id: string;
    code: string;
    nom: string;
    secteurIds: string[];
    auteurModificationId: string;
  }): Promise<Direction>;
  supprimer(donnees: { id: string; auteurModificationId: string }): Promise<void>;
}
