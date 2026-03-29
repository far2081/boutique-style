<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Sikandar Hayat Baba">
    <title>Libaas AI - Ultimate Dress-Swap Engine</title>
    <link rel="stylesheet" href="style.css">
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Core Libraries (No Frameworks) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <!-- GLTFLoader explicitly included for Model fetching -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
    
    <!-- Phase 2: Drafting Outfit Loading Spinner -->
    <div id="loading-overlay" style="display:none;">
        <i class="fa-solid fa-wand-magic-sparkles fa-beat" style="font-size: 50px; color: #D4AF37;"></i>
        <h2 style="margin-top: 15px; letter-spacing: 3px; color: #D4AF37;">Drafting Outfit...</h2>
    </div>

    <div class="main-layout">
        
        <!-- Left: UI Config -->
        <aside class="sidebar left-sidebar">
            
            <!-- Phase 3: "My Profile" Syncing -->
            <h2 class="gold-title">My Profile</h2>
            <div class="panel">
                <div class="metric-input">
                    <label>Height (cm)</label>
                    <input type="number" id="height-val" value="170" min="140" max="210">
                </div>
                <div class="metric-input">
                    <label>Weight (kg)</label>
                    <input type="number" id="weight-val" value="65" min="40" max="150">
                </div>
                <p class="hint-text">* Matrix scales instantly sync to 3D Avatar nodes.</p>
            </div>
            
            <!-- Phase 2: "AI Advisor" Bridge -->
            <h2 class="gold-title" style="margin-top: 25px;">AI Advisor</h2>
            <div class="panel">
                <p class="hint-text">Select an AI-generated fit. The Engine will automatically download the .glb mapped rig.</p>
                <div class="dress-list">
                    <!-- Data-Type precisely mapped to JS dressLibrary array -->
                    <button class="advisor-dress-btn active" data-type="Summer-Red">Summer Red Collection</button>
                    <button class="advisor-dress-btn" data-type="Winter-Emerald">Winter Emerald Silk</button>
                    <button class="advisor-dress-btn" data-type="Spring-Gold">Spring Gold Cotton</button>
                </div>
            </div>
            
        </aside>

        <!-- Center: Engine Viewport -->
        <main class="viewport">
            <div id="canvas-container"></div>
            <div class="hint-overlay">
                <i class="fa-solid fa-cube"></i> Left Click to Rotate | Scroll to Zoom
            </div>
        </main>
        
    </div>

    <!-- Phase 4: Mandatory Branding -->
    <footer class="fixed-footer">
        Designed and Developed by Sikandar Hayat Baba
    </footer>

    <!-- Core App Logic -->
    <script src="engine.js"></script>
</body>
</html>
