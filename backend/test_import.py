import sys
print("Testing imports...")

try:
    from schemas.rheumatology import SchoolApplicationCreate, SchoolApplicationResponse
    print("OK: SchoolApplicationCreate, SchoolApplicationResponse imported")
except Exception as e:
    print(f"ERROR importing schemas: {e}")
    sys.exit(1)

try:
    from database import SchoolApplication
    print("OK: SchoolApplication model imported")
except Exception as e:
    print(f"ERROR importing model: {e}")
    sys.exit(1)

try:
    from api.content import router
    print(f"OK: Router imported, {len(router.routes)} routes")

    # Find school-applications route
    found = False
    for route in router.routes:
        if hasattr(route, 'path') and 'school' in route.path:
            print(f"FOUND: {route.methods} {route.path}")
            found = True

    if not found:
        print("NOT FOUND: No school-applications route!")
        # Print last 5 routes
        print("\nLast 5 routes:")
        for route in router.routes[-5:]:
            if hasattr(route, 'path'):
                print(f"  {route.methods} {route.path}")
except Exception as e:
    print(f"ERROR importing router: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nDone!")
