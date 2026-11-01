# Personal

Čtyři projekty v jednom repozitáři. Projekt je složka, ne větev.

| Projekt | Složka | Otevři v Cursoru |
| --- | --- | --- |
| Folio | `folio/` | `Folio.code-workspace` |
| FAST | `fast-manager/` | `FAST.code-workspace` |
| Deníky | `deniky/` | `Deniky.code-workspace` |
| Ostatní | `ostatni/` | `Ostatni.code-workspace` |

V titulku okna je jméno projektu a větev, třeba `Folio · main`. Když titulek jménem projektu nezačíná, je otevřený celý repozitář.

Jediná trvalá větev je `main`. Na ní jsou všechny čtyři projekty. Nová práce začíná z ní a jmenuje se podle změny (`feat/…`, `fix/…`). Po sloučení se ta větev smaže. Větve `cursor/…` a `claude/…` jsou staré úkoly, ne jiný projekt.

```bash
./project
./project folio
```

Samostatné soukromé repozitáře odtud založit nejdou. Tenhle účet agenta smí zapisovat jen sem.
