export default interface Secteur {
  id: string;
  code: string;
  nom: string;
  accordGouvernance: boolean;
  membreGouvernementId: string | null;
}
