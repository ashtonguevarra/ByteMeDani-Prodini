import time
import subprocess
from datetime import datetime
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.console import Console
from rich.layout import Layout

console = Console()

def get_active_window():
    try:
        root = subprocess.Popen(['xdotool', 'getactivewindow', 'getwindowname'], 
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, _ = root.communicate()
        return stdout.decode('utf-8').strip() or "Desktop / Idle"
    except:
        return "Unknown"

def generate_layout(current_window, history):
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main"),
        Layout(name="footer", size=3)
    )
    
    # Header: Current Focus
    layout["header"].update(Panel(f"[bold cyan]Current Focus:[/bold cyan] {current_window}", border_style="blue"))
    
    # Main: Activity Log Table
    table = Table(title="Recent Activity Log", expand=True)
    table.add_column("Timestamp", style="dim", width=20)
    table.add_column("Window/Project", style="green")
    
    for entry in history[-10:]:  # Show last 10 entries
        table.add_row(entry['time'], entry['window'])
    
    layout["main"].update(Panel(table, border_style="white"))
    
    # Footer: Stats
    layout["footer"].update(Panel(f"System Monitor Active | {datetime.now().strftime('%H:%M:%S')}", style="dim italic"))
    
    return layout

def main():
    history = []
    last_window = ""
    
    with Live(generate_layout("Initializing...", history), refresh_per_second=2, screen=True) as live:
        while True:
            current_window = get_active_window()
            
            # Log changes
            if current_window != last_window:
                history.append({
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "window": current_window
                })
                last_window = current_window
            
            # Update the live dashboard
            live.update(generate_layout(current_window, history))
            time.sleep(1)

if __name__ == "__main__":
    main()


#priority app 
#inject ai to flag stuff
#not scrollable
