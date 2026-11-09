import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile
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

    def test_command_line_generation_and_check_are_idempotent(self):
        catalog = {
            "organization": "Sheily-AI",
            "repositories": [{"name": "SHEILY", "label": "SHEILY"}],
        }
        metadata = [
            {
                "name": "SHEILY",
                "html_url": "https://github.com/Sheily-AI/SHEILY",
                "description": "Producto cognitivo gobernado.",
                "default_branch": "main",
                "private": True,
                "archived": False,
                "pushed_at": "2026-11-09T17:49:04Z",
            }
        ]
        initial_profile = "\n".join(
            [
                "# Sheily-AI",
                MODULE.START_MARKER,
                "Pendiente.",
                MODULE.END_MARKER,
                "",
            ]
        )

        with tempfile.TemporaryDirectory() as directory:
            temporary = pathlib.Path(directory)
            catalog_path = temporary / "catalog.json"
            metadata_path = temporary / "metadata.json"
            profile_path = temporary / "README.md"
            catalog_path.write_text(json.dumps(catalog), encoding="utf-8")
            metadata_path.write_text(json.dumps(metadata), encoding="utf-8")
            profile_path.write_text(initial_profile, encoding="utf-8")
            command = [
                sys.executable,
                str(ROOT / "scripts" / "generate_profile.py"),
                "--catalog",
                str(catalog_path),
                "--profile",
                str(profile_path),
                "--metadata-file",
                str(metadata_path),
            ]

            generated = subprocess.run(command, capture_output=True, text=True, check=False)
            checked = subprocess.run(
                [*command, "--check"], capture_output=True, text=True, check=False
            )

            self.assertEqual(generated.returncode, 0, generated.stderr)
            self.assertEqual(checked.returncode, 0, checked.stderr)
            self.assertIn("Producto cognitivo gobernado.", profile_path.read_text())


if __name__ == "__main__":
    unittest.main()
