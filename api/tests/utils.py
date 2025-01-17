from pathlib import Path
from shutil import copytree
from tempfile import mkdtemp
from typing import Literal, Optional, Tuple

from src.automations.manager import AutomationManager
from src.automations.types import BaseAutomation
from src.hass_config.loader import HassConfig
from src.yaml_serializer import IncludedYaml, dump_yaml

THIS_FOLDER = Path(__file__).parent
SAMPLES_FOLDER = THIS_FOLDER / "samples"
HA_CONFIG_EXAMPLE = SAMPLES_FOLDER / "config"
HA_CONFIG2_EXAMPLE = SAMPLES_FOLDER / "config-2"
HA_CONFIG3_EXAMPLE = SAMPLES_FOLDER / "config-3"
HA_CONFIG4_EXAMPLE = SAMPLES_FOLDER / "config-4"
HA_CONFIG5_EXAMPLE = SAMPLES_FOLDER / "config-5"
HA_CONFIG6_EXAMPLE = SAMPLES_FOLDER / "config-6"
HA_CONFIG7_EXAMPLE = SAMPLES_FOLDER / "config-7"
HA_CONFIG8_EXAMPLE = SAMPLES_FOLDER / "config-8"
HA_CONFIG9_EXAMPLE = SAMPLES_FOLDER / "config-9"
HA_CONFIG10_EXAMPLE = SAMPLES_FOLDER / "config-10"
HA_CONFIG11_EXAMPLE = SAMPLES_FOLDER / "config-11"
HA_CONFIG12_EXAMPLE = SAMPLES_FOLDER / "config-12"
HA_CONFIG13_EXAMPLE = SAMPLES_FOLDER / "config-13"


def get_example_automation_loader(
    config_to_copy: Path = HA_CONFIG_EXAMPLE,
) -> Tuple[Path, HassConfig, AutomationManager]:
    """Creates an example automation loader from the samples folder

    Returns:
        Tuple[Path, HassConfig, AutomationManager]
    """
    root_folder = create_copy_of_example_config(config_to_copy)
    hass_config = HassConfig(root_folder)
    automation_loader = AutomationManager(hass_config)
    return root_folder, hass_config, automation_loader


def create_copy_of_example_config(config_to_copy: Path = HA_CONFIG_EXAMPLE) -> Path:
    """Creates a copy of the example config folder

    Returns:
        Path
    """
    root_folder = Path(mkdtemp())
    root_folder.rmdir()
    copytree(config_to_copy, root_folder)
    return root_folder


def get_dummy_automation_loader(
    auto: list[BaseAutomation],
    secrets: Optional[dict] = None,
    other_config: Optional[dict] = None,
    automation_in_conifguration_mode: Literal["include", "inline", "none"] = "include",
) -> Tuple[Path, HassConfig, AutomationManager]:
    """Creates a dummy /config structure for testing and return the loader and config

    Args:
        auto (list[BaseAutomation]): automations
        secrets (Optional[dict], optional): dictionary of secrets
        other_config (Optional[dict], optional): some config stuff to place into configuration.yaml. Defaults to None.
        automation_in_conifguration_mode (Literal['include', 'inline', 'none'], optional): whether to !include automation as a separete file or in the configuration yaml. Defaults to inline.

    Returns:
        Path: [description]
    """
    root_folder = create_dummy_config_folder(
        auto,
        secrets,
        other_config,
        automation_in_conifguration_mode,
    )
    hass_config = HassConfig(root_folder)
    automation_loader = AutomationManager(hass_config)
    return root_folder, hass_config, automation_loader


def create_dummy_config_folder(
    auto: list[BaseAutomation],
    secrets: Optional[dict] = None,
    other_config: Optional[dict] = None,
    automation_in_conifguration_mode: Literal["include", "inline", "none"] = "include",
) -> Path:
    """Creates a dummy /config structure for testing

    Args:
        auto (list[BaseAutomation]): automations
        secrets (Optional[dict], optional): dictionary of secrets
        other_config (Optional[dict], optional): some config stuff to place into configuration.yaml. Defaults to None.
        automation_in_conifguration_mode (Literal['include', 'inline', 'none'], optional): whether to !include automation as a separete file or in the configuration yaml. Defaults to inline.

    Returns:
        Path: [description]
    """
    root_folder = Path(mkdtemp())
    auto_prims = [a.to_primitive() for a in auto]
    configuration_yaml = {**other_config} if other_config is not None else {}
    if automation_in_conifguration_mode == "inline":
        configuration_yaml["automation"] = auto_prims
    elif automation_in_conifguration_mode == "include":
        configuration_yaml["automation"] = IncludedYaml(
            root_folder / "automations.yaml",
        )
    if automation_in_conifguration_mode != "inline":
        (root_folder / "automations.yaml").write_text(dump_yaml(auto_prims, root_path=root_folder))
    if secrets is not None:
        (root_folder / "secrets.yaml").write_text(dump_yaml(secrets, root_path=root_folder))
    (root_folder / "configuration.yaml").write_text(
        dump_yaml(configuration_yaml, root_path=root_folder)
    )
    return root_folder
