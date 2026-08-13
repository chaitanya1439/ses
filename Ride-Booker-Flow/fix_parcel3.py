with open("app/parcel-confirmed.tsx", "r") as f:
    code = f.read()

bad_block = """  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaBadge: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  etaBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 250,
    backgroundColor: Colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});
"""

# Replace all occurrences back to "});\n"
code = code.replace(bad_block, "});\n")

# But we DO want the bad_block at the very end of the file instead of "});\n"
# Because it contains the valid styles for the end!
if code.endswith("});\n"):
    code = code[:-5] + bad_block

with open("app/parcel-confirmed.tsx", "w") as f:
    f.write(code)

print("Fixed")
