import EntreeJournal from "@/server/journal/domain/EntreeJournal.interface";

export default interface JournalRepository {
  lister(): Promise<EntreeJournal[]>;
}
