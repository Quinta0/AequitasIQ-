import os
import sys
import subprocess
import platform
import json
import shutil
from pathlib import Path
import argparse
import venv
import webbrowser
from threading import Thread
import time
import winreg  # for Windows registry checking

class AppManager:
    def __init__(self):
        self.root_dir = Path(__file__).parent
        self.frontend_dir = self.root_dir / "frontend"
        self.backend_dir = self.root_dir / "backend"
        self.backend_app_dir = self.backend_dir / "app"
        self.venv_dir = self.root_dir / ".venv"
        self.is_windows = platform.system() == "Windows"

    def find_node_in_registry(self):
        """Find Node.js installation path in Windows registry"""
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Node.js", 0, winreg.KEY_READ | winreg.KEY_WOW64_32KEY) as key:
                return winreg.QueryValueEx(key, "InstallPath")[0]
        except:
            return None

    def find_program_path(self, program):
        """Find the full path of a program"""
        if self.is_windows:
            program_exe = f"{program}.exe"
            # Check current directory
            if Path(program_exe).exists():
                return str(Path(program_exe).absolute())
            
            # Check Windows registry for Node.js
            if program in ['node', 'npm']:
                node_path = self.find_node_in_registry()
                if node_path:
                    program_path = Path(node_path) / program_exe
                    if program_path.exists():
                        return str(program_path)

            # Check PATH environment variable
            for path in os.environ["PATH"].split(os.pathsep):
                exe_path = Path(path) / program_exe
                if exe_path.exists():
                    return str(exe_path)
        else:
            # Unix-like systems
            try:
                return subprocess.check_output(['which', program]).decode().strip()
            except subprocess.CalledProcessError:
                return None
        
        return None

    def check_dependencies(self):
        """Check if required dependencies are installed"""
        try:
            # Check Python version
            python_version = sys.version_info
            if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
                print("Error: Python 3.8 or higher is required")
                print(f"Current Python version: {python_version.major}.{python_version.minor}")
                return False

            # Check Node.js
            node_path = self.find_program_path('node')
            if not node_path:
                print("Error: Node.js is not installed or not found in PATH")
                print("Please install Node.js from https://nodejs.org/")
                print("After installation, you may need to restart your terminal/computer")
                return False
            
            try:
                node_version = subprocess.run([node_path, '--version'], 
                                           capture_output=True, 
                                           text=True, 
                                           check=True).stdout.strip()
                print(f"Found Node.js: {node_version} at {node_path}")
            except subprocess.CalledProcessError as e:
                print(f"Error checking Node.js version: {e}")
                return False

            # Check npm
            npm_path = self.find_program_path('npm')
            if not npm_path:
                print("Error: npm is not installed or not found in PATH")
                print("npm should be installed with Node.js")
                print("Try reinstalling Node.js from https://nodejs.org/")
                return False

            try:
                npm_version = subprocess.run([npm_path, '--version'], 
                                          capture_output=True, 
                                          text=True, 
                                          check=True).stdout.strip()
                print(f"Found npm: {npm_version} at {npm_path}")
            except subprocess.CalledProcessError as e:
                print(f"Error checking npm version: {e}")
                return False

            return True

        except Exception as e:
            print(f"Error checking dependencies: {str(e)}")
            print("Detailed error information:")
            print(f"System: {platform.system()}")
            print(f"PATH: {os.environ.get('PATH', 'Not found')}")
            return False

    def create_virtual_environment(self):
        """Create a Python virtual environment"""
        try:
            print("Creating virtual environment...")
            venv.create(self.venv_dir, with_pip=True)
            
            # Upgrade pip in the virtual environment
            if self.is_windows:
                pip_exec = self.venv_dir / "Scripts" / "python.exe"
                subprocess.run([str(pip_exec), "-m", "pip", "install", "--upgrade", "pip"], check=True)
            else:
                pip_exec = self.venv_dir / "bin" / "python"
                subprocess.run([str(pip_exec), "-m", "pip", "install", "--upgrade", "pip"], check=True)
            
            return True
        except Exception as e:
            print(f"Error creating virtual environment: {e}")
            return False

    def install_dependencies(self):
        """Install Python and Node.js dependencies"""
        try:
            # Activate virtual environment
            if self.is_windows:
                python_exec = self.venv_dir / "Scripts" / "python.exe"
                pip_exec = self.venv_dir / "Scripts" / "pip.exe"
            else:
                python_exec = self.venv_dir / "bin" / "python"
                pip_exec = self.venv_dir / "bin" / "pip"

            # Install backend dependencies
            requirements_file = self.backend_app_dir / "requirements.txt"
            if not requirements_file.exists():
                print(f"Warning: requirements.txt not found at {requirements_file}")
                print("Creating default requirements.txt...")
                with open(requirements_file, 'w') as f:
                    f.write("""fastapi
uvicorn
sqlalchemy
python-dateutil
pandas
langchain
langchain-ollama
pydantic
python-multipart
""")

            print("Installing backend dependencies...")
            subprocess.run([str(pip_exec), "install", "-r", str(requirements_file)], check=True)

            # Install frontend dependencies
            print("Installing frontend dependencies...")
            os.chdir(self.frontend_dir)
            subprocess.run(["npm", "install"], check=True)
            os.chdir(self.root_dir)

            return True
        except Exception as e:
            print(f"Error installing dependencies: {e}")
            return False

    def build_frontend(self):
        """Build the frontend application"""
        try:
            print("Building frontend...")
            os.chdir(self.frontend_dir)
            subprocess.run(["npm", "run", "build"], check=True)
            os.chdir(self.root_dir)
            return True
        except Exception as e:
            print(f"Error building frontend: {e}")
            return False

    def start_backend(self):
        """Start the backend server"""
        if self.is_windows:
            python_exec = self.venv_dir / "Scripts" / "python.exe"
        else:
            python_exec = self.venv_dir / "bin" / "python"

        os.chdir(self.backend_dir)
        # Updated to handle app directory structure
        subprocess.Popen([str(python_exec), "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"])
        os.chdir(self.root_dir)

    def start_frontend(self):
        """Start the frontend development server"""
        os.chdir(self.frontend_dir)
        subprocess.Popen(["npm", "run", "dev"])
        os.chdir(self.root_dir)

    def create_executable(self):
        """Create executable using PyInstaller"""
        try:
            if self.is_windows:
                pip_exec = self.venv_dir / "Scripts" / "pip.exe"
            else:
                pip_exec = self.venv_dir / "bin" / "pip"

            # Install PyInstaller
            subprocess.run([str(pip_exec), "install", "pyinstaller"], check=True)

            # Create spec file
            spec_content = """
# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('frontend/dist', 'frontend/dist'),
        ('backend/app', 'backend/app'),
    ],
    hiddenimports=['uvicorn.logging', 'uvicorn.loops', 'uvicorn.loops.auto', 'uvicorn.protocols', 'uvicorn.protocols.http', 'uvicorn.protocols.http.auto', 'uvicorn.protocols.websockets', 'uvicorn.protocols.websockets.auto', 'uvicorn.lifespan', 'uvicorn.lifespan.on'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AequitasIQ',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
"""
            with open("AequitasIQ.spec", "w") as f:
                f.write(spec_content)

            # Build executable
            if self.is_windows:
                pyinstaller = self.venv_dir / "Scripts" / "pyinstaller.exe"
            else:
                pyinstaller = self.venv_dir / "bin" / "pyinstaller"

            subprocess.run([str(pyinstaller), "AequitasIQ.spec"], check=True)
            return True
        except Exception as e:
            print(f"Error creating executable: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="AequitasIQ Application Manager")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")
    parser.add_argument("--build-exe", action="store_true", help="Build executable")
    parser.add_argument("--verbose", action="store_true", help="Show detailed output")
    args = parser.parse_args()

    app_manager = AppManager()

    # Check dependencies with more detailed output
    print("Checking dependencies...")
    if not app_manager.check_dependencies():
        print("\nPlease fix the above issues and try again.")
        print("If you've just installed Node.js, try closing and reopening your terminal.")
        print("You may also need to restart your computer for PATH changes to take effect.")
        sys.exit(1)

    print("\nAll dependencies found successfully!")

    # Create virtual environment if it doesn't exist
    if not app_manager.venv_dir.exists():
        print("\nSetting up Python virtual environment...")
        if not app_manager.create_virtual_environment():
            sys.exit(1)

    # Continue with the rest of the setup...
    print("\nInstalling project dependencies...")
    if not app_manager.install_dependencies():
        sys.exit(1)

    if args.build_exe:
        print("\nBuilding executable...")
        if not app_manager.build_frontend():
            sys.exit(1)
        if not app_manager.create_executable():
            sys.exit(1)
        print("\nExecutable created successfully in the dist directory")
        sys.exit(0)

    # Start the application
    if args.dev:
        print("\nStarting in development mode...")
        backend_thread = Thread(target=app_manager.start_backend)
        frontend_thread = Thread(target=app_manager.start_frontend)
        
        backend_thread.start()
        frontend_thread.start()
        
        print("\nStarting servers...")
        time.sleep(5)
        webbrowser.open("http://localhost:3000")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")
    else:
        if not (app_manager.frontend_dir / "dist").exists():
            print("\nBuilding frontend...")
            if not app_manager.build_frontend():
                sys.exit(1)
        
        print("\nStarting in production mode...")
        app_manager.start_backend()
        webbrowser.open("http://localhost:8000")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")

if __name__ == "__main__":
    main()