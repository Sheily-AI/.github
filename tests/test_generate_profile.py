import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "generate_profile", ROOT / "scripts" / "generate_profile.py"
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class GenerateProfileTests(unittest.TestCase):
    def test_generated_section_is_stable_and_escapes_markdown(self):
        catalog = {
            "organization": "Sheily-AI",
            "repositories": [{"name": "SHEILY", "label": "SHEILY | Core"}],
        }
        metadata = [
            {
                "name": "SHEILY",
                "html_url": "https://github.com/Sheily-AI/SHEILY",
                "description": "Cognición | memoria",
                "default_branch": "main",
                "private": True,
                "archived": False,
                "pushed_at": "2026-11-09T17:49:04Z",
            }
        ]

        section = MODULE.render_section(catalog, metadata)

        self.assertIn("SHEILY \\| Core", section)
        self.assertIn("Cognición \\| memoria", section)
        self.assertIn("2026-11-09 17:49 UTC", section)
        self.assertNotIn("datetime.now", section)

    def test_replace_requires_one_owned_region(self):
        with self.assertRaises(ValueError):
            MODULE.replace_generated_section("# no markers", "replacement")


if __name__ == "__main__":
    unittest.main()
