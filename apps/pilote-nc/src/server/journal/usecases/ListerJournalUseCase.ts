import JournalRepository from "@/server/journal/domain/ports/JournalRepository";
import EntreeJournal from "@/server/journal/domain/EntreeJournal.interface";

export default class ListerJournalUseCase {
  constructor(
    private readonly dependencies: { journalRepository: JournalRepository },
  ) {}

  async run(): Promise<EntreeJournal[]> {
    return this.dependencies.journalRepository.lister();
  }
}
