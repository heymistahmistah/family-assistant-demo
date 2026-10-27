# Installable application shell

> **Fictional public demo:** this repository contains only deployable app files.
> Private SmartHub planning and future family data are not included. Changes stay
> in the current browser; do not enter real private information.

Live demo: <https://heymistahmistah.github.io/family-assistant-demo/>

This is the first real cross-device application foundation. It is a dependency-free
Progressive Web App that now tests installation, responsive layout, navigation,
offline shell caching, and locally persistent fictional To-dos and events before
adding accounts or private data.

Current limitations:

- all content remains fictional; seed records come from the source and user-created
  demo tasks are stored only in that browser;
- there is no backend, account, production authentication, external calendar
  connection, AI, or notification service;
- the voice button demonstrates the intended tap-to-start/tap-to-stop interaction
  but does not record;
- the local four-digit Adult mode gate prevents accidental child access but is
  not treated as production account security.

Working demo behaviour:

- add and change a To-do;
- choose Today, Tomorrow, Soon, Later, or Waiting;
- assign one or more responsible people;
- separately mark a task as for Eulalie or Léonore;
- complete and reopen it while retaining timestamped local history;
- render shared To-dos and fictional calendar events on the wall view while
  keeping private records off the wall;
- type a messy thought, review the proposed task, and Add, Review later, or
  Ignore it;
- reopen the app without losing local changes;
- create a local screen PIN, lock Adult mode, and require the PIN before leaving
  the child-safe wall;
- use the real current date and Monday-first current week instead of a date frozen
  into the prototype.

The prototype can be served from the repository root with:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/app/`.
