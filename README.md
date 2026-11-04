# Personal

Tři projekty v jednom repozitáři. Projekt je složka, ne větev.

| Projekt | Složka | Otevři v Cursoru |
| --- | --- | --- |
| Deníky | `deniky/` | `Deniky.code-workspace` |
| Ostatní | `ostatni/` | `Ostatni.code-workspace` |
| Pošta | `posta/` | `Posta.code-workspace` |

**Folio** a **F.A.S.T. Manager** už v tomto repozitáři nejsou — mají vlastní repozitáře:

- Folio: https://github.com/samwe20/Folio
- F.A.S.T. Manager: https://github.com/samwe20/F.A.S.T.-Manager

V titulku okna je jméno projektu a větev, třeba `Pošta · main`. Když titulek jménem projektu nezačíná, je otevřený celý repozitář.

Jediná trvalá větev je `main`. Na ní jsou všechny tři projekty. Nová práce začíná z ní a jmenuje se podle změny (`feat/…`, `fix/…`). Po sloučení se ta větev smaže. Větve `cursor/…` a `claude/…` jsou staré úkoly, ne jiný projekt.

```bash
./project
./project deniky
```

Samostatné soukromé repozitáře odtud založit nejdou. Tenhle účet agenta smí zapisovat jen sem.
