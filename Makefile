.PHONY: up down down-v logs logs-back logs-front seed seed-torneos seed-stats seed-masivo clean-garbage

# ==========================================
# 🐳 ORQUESTACIÓN DOCKER
# ==========================================

# Levantar toda la infraestructura en primer plano
up:
	docker compose up --build

# Bajar la infraestructura sin borrar datos
down:
	docker compose down

# Bajar la infraestructura y purgar los volumenes de datos
down-v:
	docker compose down -v

# Ver logs combinados en tiempo real
logs:
	docker compose logs -f

# Ver logs específicos
logs-back:
	docker compose logs -f backend

logs-front:
	docker compose logs -f frontend

# ==========================================
# 💾 SEEDERS Y MANTENIMIENTO (Ejecutados dentro del contenedor)
# ==========================================

# Poblar la BD base (canchas, dueños, jugadores)
seed:
	docker exec -it bdd_backend python scripts/cargar_datos.py

# Poblar Torneos
seed-torneos:
	docker exec -it bdd_backend python scripts/cargar_torneo.py

# Poblar Estadísticas específicas
seed-stats:
	docker exec -it bdd_backend python scripts/seed_estadisticas_miguel.py

# Seeder Masivo para Testing de Estrés (Índices y DB)
seed-masivo:
	docker exec -it bdd_backend pip install faker
	docker exec -it bdd_backend python scripts/seed_masivo.py

# ==========================================
# 🧹 HOUSEKEEPING LOCAL
# ==========================================

clean-garbage:
	rm -f patch_main.py test_validation.py test_validation2.py 'tandardize round-robin generation"q' test_output.txt backend/test_db.py frontend/scratch_fixture.py frontend/tsc_errors.log
	mkdir -p backend/scripts
	mv backend/cargar_datos.py backend/cargar_torneo.py backend/crear_torneo_test.py backend/seed_estadisticas_miguel.py backend/anotar_equipos.py backend/scripts/ || true