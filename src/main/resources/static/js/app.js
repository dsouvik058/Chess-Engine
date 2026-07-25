// Chess Engine Game Client Controller
$(document).ready(function() {
    let board = null;
    const game = new Chess();
    const API_BASE = '/api/chess';

    // State variables for Click-to-Move and Move Analysis
    let selectedSquare = null;
    let evalHistory = [30]; // default initial evaluation in centipawns (starting pos is slightly white favored)
    let moveClassifications = []; // list of classifications for each move in the game
    let isGameOver = false; // flag to block moves once game is complete

    // Game Mode and Timer State
    let currentGameMode = 'computer'; // 'computer', '1v1', 'analyze'
    let whiteTime = 0;
    let blackTime = 0;
    let whiteInitialTime = 0;
    let blackInitialTime = 0;
    let timerInterval = null;
    let playerColor = 'white'; // 'white', 'black', 'random'

    // Multiplayer Online State
    let isMultiplayerOnline = false;
    let currentSubmode1v1 = 'local'; // 'local' or 'online'
    let currentRoomId = null;
    let myPlayerId = null;
    let myAssignedColor = 'white';
    let stompClient = null;

    // PGN Stepper & Analysis State
    let isAnalysisComplete = false;
    let analysisMoves = [];
    let analysisIndex = 0;
    let analysisHistory = [];
    let analysisEvaluations = [];
    let analysisClassifications = [];
    let analysisClocks = []; // parsed times for each move

    // UI elements
    const $eloSlider = $('#elo-slider');
    const $eloValue = $('#elo-value');
    const $eloDesc = $('#elo-desc');
    const $depthStat = $('#stat-depth');
    const $npsStat = $('#stat-nps');
    const $nodesStat = $('#stat-nodes');
    const $timeStat = $('#stat-time');
    const $evaluationBar = $('#evaluation-bar');
    const $evaluationText = $('#evaluation-text');
    const $moveHistoryBody = $('#move-history-body');
    const $engineStatusDot = $('#engine-status-indicator .status-dot');
    const $engineStatusLabel = $('#engine-status-indicator .status-label');

    // ELO mapping descriptions
    const eloClasses = {
        400: "Absolute Beginner (Just learning moves)",
        450: "Casual Beginner (Frequent blunders)",
        500: "Beginner (Learning simple captures)",
        555: "Beginner (Learning basic checkmates)",
        600: "Beginner (Basic opening ideas)",
        650: "Novice (Learning piece protection)",
        700: "Novice (Starts spotting simple tactics)",
        750: "Novice (Developing board vision)",
        800: "Advanced Novice (Fewer simple blunders)",
        850: "Early Intermediate (Developing plans)",
        900: "Early Intermediate (Basic strategy)",
        950: "Early Intermediate (Improving tactical vision)",
        1000: "Intermediate Player (Solid chess fundamentals)",
        1050: "Intermediate Player (Standard club level)",
        1100: "Intermediate Player (Developing active play)",
        1150: "Intermediate Player (Balanced attack/defense)",
        1200: "Strong Intermediate (Tactical awareness)",
        1250: "Strong Intermediate (Positional concepts)",
        1300: "Strong Intermediate (Solid club competitor)",
        1350: "Beginner level (Casual play)",
        1400: "Novice Player",
        1500: "Club Player (Low)",
        1600: "Club Player (Mid)",
        1700: "Club Player (Strong)",
        1800: "Class A Player",
        1900: "Expert Candidate",
        2000: "Expert Player",
        2100: "Candidate Master (Low)",
        2200: "Candidate Master (CM)",
        2300: "FIDE Master Candidate",
        2400: "FIDE Master (FM)",
        2500: "International Master Candidate",
        2600: "International Master (IM)",
        2700: "Grandmaster (GM)",
        2800: "Super Grandmaster (Super GM)",
        2900: "Elite World Champion Level",
        3000: "Superhuman AI",
        3100: "Stockfish Tactical Master",
        3200: "Grandmaster (Stockfish Maximum Strength)"
    };

    // Check backend connection on load
    checkStatus();

    // Initialize Chessboard
    const config = {
        draggable: false, // Disable dragging completely
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    board = Chessboard('chess-board', config);

    // Ensure resizing handles board scaling
    $(window).resize(function() {
        board.resize();
        syncEvalBarHeight();
    });

    function syncEvalBarHeight() {
        setTimeout(function() {
            const boardHeight = $('#chess-board').height();
            if (boardHeight > 0) {
                $('.eval-bar-container').css({
                    'height': boardHeight + 'px',
                    'min-height': boardHeight + 'px'
                });
            }
        }, 50);
    }

    // View Switching Controllers
    function showWelcomeView() {
        stopClocks();
        $('#game-view').fadeOut(200, function() {
            $('#welcome-view').fadeIn(200);
        });
        isAnalysisComplete = false;
    }

    function showGameView(mode) {
        currentGameMode = mode;

        function applyModeLayout() {
            $('#game-view').fadeIn(200);

            if (mode === 'computer') {
                $('#sidebar-settings-panel').show();
                $('#sidebar-analytics-panel').show();
                $('#sidebar-controls-panel').show();
                $('#sidebar-stepper-panel').hide();
                $('#game-accuracy-panel').hide();
                $('#engine-status-indicator').show();
                $('.eval-bar-container').show();
                $('#sidebar-review-panel').show();
                $('#clock-white').show().removeClass('active low-time');
                $('#clock-black').show().removeClass('active low-time');

                const elo = $('#portal-elo-slider').val();
                if (playerColor === 'white') {
                    $('#player-name').text('Player');
                    $('#opponent-name').text('Stockfish (' + elo + ' ELO)');
                } else {
                    $('#player-name').text('Stockfish (' + elo + ' ELO)');
                    $('#opponent-name').text('Player');
                }
                setupTimeFormat();
            } else if (mode === '1v1') {
                $('#sidebar-settings-panel').hide();
                $('#sidebar-analytics-panel').hide();
                $('#sidebar-controls-panel').show();
                $('#sidebar-stepper-panel').hide();
                $('#game-accuracy-panel').hide();
                $('#engine-status-indicator').hide();
                $('.eval-bar-container').hide();
                $('#sidebar-review-panel').hide();
                $('#clock-white').show().removeClass('active low-time');
                $('#clock-black').show().removeClass('active low-time');

                $('#player-name').text('White Player');
                $('#opponent-name').text('Black Player');
                setupTimeFormat();
            } else if (mode === 'analyze') {
                $('#sidebar-settings-panel').hide();
                $('#sidebar-analytics-panel').hide();
                $('#sidebar-controls-panel').hide();
                $('#sidebar-stepper-panel').show();
                $('#game-accuracy-panel').show();
                $('#engine-status-indicator').show();
                $('.eval-bar-container').show();
                $('#sidebar-review-panel').show();

                $('#clock-white').show().removeClass('active low-time').text('--:--');
                $('#clock-black').show().removeClass('active low-time').text('--:--');
            }

            setTimeout(function() {
                board.resize();
                syncEvalBarHeight();
            }, 100);
        }

        if ($('#welcome-view').is(':visible')) {
            $('#welcome-view').fadeOut(200, applyModeLayout);
        } else {
            $('#welcome-view').hide();
            applyModeLayout();
        }
    }

    // Portal Interactive Handlers
    $('.mode-card').on('click', function() {
        $('.mode-card').removeClass('active');
        $(this).addClass('active');
        
        const mode = $(this).data('mode');
        if (mode === 'computer') {
            $('#setup-match').addClass('active');
            $('#setup-analyze').removeClass('active');
            $('#field-color').show();
            $('#field-elo').show();
            $('#field-1v1-submode').hide();
            $('#field-online-rooms').hide();
            $('#btn-start-match').show();
        } else if (mode === '1v1') {
            $('#setup-match').addClass('active');
            $('#setup-analyze').removeClass('active');
            $('#field-color').hide();
            $('#field-elo').hide();
            $('#field-1v1-submode').show();
            if (currentSubmode1v1 === 'online') {
                $('#field-online-rooms').show();
                $('#btn-start-match').hide();
            } else {
                $('#field-online-rooms').hide();
                $('#btn-start-match').show();
            }
        } else if (mode === 'analyze') {
            $('#setup-match').removeClass('active');
            $('#setup-analyze').addClass('active');
            $('#field-1v1-submode').hide();
            $('#field-online-rooms').hide();
            $('#btn-start-match').show();
        }
    });

    // Submode toggle (Local 1v1 vs Online 1v1)
    $('.submode-btn').on('click', function() {
        $('.submode-btn').removeClass('active');
        $(this).addClass('active');
        currentSubmode1v1 = $(this).data('submode');

        if (currentSubmode1v1 === 'online') {
            $('#field-online-rooms').slideDown(200);
            $('#btn-start-match').hide();
        } else {
            $('#field-online-rooms').slideUp(200);
            $('#btn-start-match').show();
        }
    });

    $('#portal-elo-slider').on('input', function() {
        const val = $(this).val();
        $('#portal-elo-value').text(val + ' ELO');
        $('#portal-elo-desc').text(eloClasses[val] || "Custom Rating Level");
        // Sync to sidebar
        $eloSlider.val(val);
        $eloValue.text(val + ' ELO');
        $eloDesc.text(eloClasses[val] || "Custom Rating Level");
    });

    $eloSlider.on('input', function() {
        const val = $(this).val();
        $eloValue.text(val + ' ELO');
        $eloDesc.text(eloClasses[val] || "Custom Rating Level");
        // Sync to portal
        $('#portal-elo-slider').val(val);
        $('#portal-elo-value').text(val + ' ELO');
        $('#portal-elo-desc').text(eloClasses[val] || "Custom Rating Level");
    });

    $eloSlider.on('change', function() {
        updateEngineConfiguration();
    });

    $('#btn-start-match').on('click', function() {
        const mode = $('.mode-card.active').data('mode');
        playerColor = $('#color-select').val();
        isMultiplayerOnline = false;
        
        if (playerColor === 'random') {
            playerColor = Math.random() < 0.5 ? 'white' : 'black';
        }
        
        showGameView(mode);
        resetGame();
        
        if (mode === 'computer') {
            updateEngineConfiguration();
            if (playerColor === 'black') {
                board.orientation('black');
                setTimeout(makeEngineFirstMove, 500);
            } else {
                board.orientation('white');
                startClockTicking();
            }
        } else if (mode === '1v1') {
            board.orientation('white');
            startClockTicking();
        }
    });

    // Create Online Room Handler
    $('#btn-create-room').on('click', function() {
        const preferredColor = $('#create-room-color').val();
        const timeVal = $('#time-select').val();
        const timeControl = timeVal === 'unlimited' ? 0 : parseInt(timeVal);

        $.ajax({
            url: '/api/multiplayer/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                preferredColor: preferredColor,
                timeControlMinutes: timeControl
            }),
            success: function(response) {
                currentRoomId = response.room.roomId;
                myPlayerId = response.playerId;
                myAssignedColor = response.playerColor;
                isMultiplayerOnline = true;

                $('#created-room-code').text(currentRoomId);
                $('#created-room-box').slideDown(200);

                connectWebSocket(currentRoomId);
            },
            error: function(err) {
                alert("Failed to create room: " + (err.responseJSON ? err.responseJSON.message : "Error"));
            }
        });
    });

    // Join Online Room Handler
    $('#btn-join-room').on('click', function() {
        const roomId = $('#join-room-input').val().trim();
        if (!roomId) {
            alert("Please enter a valid Room Code (e.g. ROOM-A4B2).");
            return;
        }

        $.ajax({
            url: '/api/multiplayer/join',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ roomId: roomId }),
            success: function(response) {
                currentRoomId = response.room.roomId;
                myPlayerId = response.playerId;
                myAssignedColor = response.playerColor;
                isMultiplayerOnline = true;

                connectWebSocket(currentRoomId, function() {
                    startOnlineMatch(response.room);
                });
            },
            error: function(err) {
                alert("Failed to join room: " + (err.responseJSON ? err.responseJSON.message : "Invalid or full room code"));
            }
        });
    });

    // Connect STOMP WebSocket
    function connectWebSocket(roomId, onConnectCallback) {
        if (stompClient && stompClient.connected) {
            if (onConnectCallback) onConnectCallback();
            return;
        }

        const socket = new SockJS('/ws-chess');
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug noise

        stompClient.connect({}, function(frame) {
            console.log('Connected to STOMP WebSocket for room: ' + roomId);

            stompClient.subscribe('/topic/room/' + roomId, function(message) {
                const payload = JSON.parse(message.body);
                handleRoomUpdate(payload);
            });

            if (onConnectCallback) onConnectCallback();
        }, function(error) {
            console.error('WebSocket connection error:', error);
        });
    }

    // Handle incoming WebSocket messages
    function handleRoomUpdate(data) {
        if (data.roomId && data.status) {
            // Full GameRoom state update
            if (data.status === 'IN_PROGRESS' && $('#game-view').is(':hidden')) {
                startOnlineMatch(data);
            } else if (data.status === 'FINISHED') {
                let title = "Game Over";
                let message = data.finishReason || "";
                if (data.winnerColor === myAssignedColor) {
                    title = "Victory!";
                    message += " You won!";
                } else if (data.winnerColor === 'draw') {
                    title = "Draw!";
                } else {
                    title = "Defeat";
                    message += " Opponent won.";
                }
                showGameOverModal(title, message);
            }
        } else if (data.from && data.to) {
            // Move event from opponent
            if (data.playerId !== myPlayerId) {
                const opponentMoveObj = game.move({
                    from: data.from,
                    to: data.to,
                    promotion: data.promotion || 'q'
                });
                if (opponentMoveObj) {
                    board.position(game.fen());
                    updateMoveHistoryTable();
                    startClockTicking();
                    if (game.game_over()) {
                        handleGameOver();
                    }
                }
            }
        }
    }

    function startOnlineMatch(room) {
        showGameView('1v1');
        resetGame();
        isMultiplayerOnline = true;

        board.orientation(myAssignedColor);

        if (myAssignedColor === 'white') {
            $('#player-name').text('You (White)');
            $('#opponent-name').text('Opponent (Black)');
        } else {
            $('#player-name').text('Opponent (White)');
            $('#opponent-name').text('You (Black)');
        }

        $engineStatusLabel.text(`Online Match (${room.roomId}) - ${myAssignedColor === 'white' ? "Your Turn" : "Opponent's Turn"}`);
        $engineStatusDot.addClass('online');

        startClockTicking();
    }

    $('#btn-load-pgn').on('click', function() {
        const pgnText = $('#pgn-textarea').val().trim();
        if (!pgnText) {
            alert("Please paste a PGN string first.");
            return;
        }
        
        const tempGame = new Chess();
        const success = tempGame.load_pgn(pgnText);
        if (!success) {
            alert("Invalid PGN string! Please check your file format.");
            return;
        }
        
        showGameView('analyze');
        
        // Read header names
        const headers = tempGame.header();
        $('#player-name').text(headers['White'] || 'White Player');
        $('#opponent-name').text(headers['Black'] || 'Black Player');
        
        analysisMoves = tempGame.history({ verbose: true });
        
        game.reset();
        board.start();
        
        // Start bulk background analysis
        startBulkAnalysis(analysisMoves);
    });

    // Menu callback
    $('#btn-main-menu').on('click', function() {
        showWelcomeView();
    });

    // Digital Clocks countdown ticking
    function setupTimeFormat() {
        const val = $('#time-select').val();
        if (val === 'unlimited') {
            $('#clock-white').hide();
            $('#clock-black').hide();
            stopClocks();
        } else {
            $('#clock-white').show();
            $('#clock-black').show();
            const totalSec = parseInt(val) * 60;
            whiteTime = totalSec;
            blackTime = totalSec;
            whiteInitialTime = totalSec;
            blackInitialTime = totalSec;
            updateClockDisplay();
        }
    }

    function startClockTicking() {
        stopClocks();
        if ($('#time-select').val() === 'unlimited') return;
        if (currentGameMode === 'analyze' || $('#game-view').is(':hidden')) return; // Guard: do not tick if on welcome screen
        
        updateClockHighlight();
        
        timerInterval = setInterval(function() {
            const turn = game.turn();
            
            if (currentGameMode === 'computer') {
                if (playerColor === 'white') {
                    if (turn === 'w') whiteTime -= 0.1;
                    else blackTime -= 0.1;
                } else {
                    if (turn === 'w') whiteTime -= 0.1;
                    else blackTime -= 0.1;
                }
            } else {
                if (turn === 'w') whiteTime -= 0.1;
                else blackTime -= 0.1;
            }
            
            if (whiteTime <= 0) {
                whiteTime = 0;
                handleTimeOut('w');
            } else if (blackTime <= 0) {
                blackTime = 0;
                handleTimeOut('b');
            }
            
            updateClockDisplay();
        }, 100);
    }

    function stopClocks() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateClockHighlight() {
        const turn = game.turn();
        if (turn === 'w') {
            $('#clock-white').addClass('active');
            $('#clock-black').removeClass('active');
        } else {
            $('#clock-black').addClass('active');
            $('#clock-white').removeClass('active');
        }
    }

    function updateClockDisplay() {
        formatClock($('#clock-white'), whiteTime);
        formatClock($('#clock-black'), blackTime);
    }

    function formatClock($el, timeInSeconds) {
        if (timeInSeconds <= 0) {
            $el.text('00:00.0').addClass('low-time');
            return;
        }
        
        const min = Math.floor(timeInSeconds / 60);
        const sec = Math.floor(timeInSeconds % 60);
        
        if (timeInSeconds < 20) {
            const tenths = Math.floor((timeInSeconds % 1) * 10);
            $el.text(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${tenths}`).addClass('low-time');
        } else {
            $el.text(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`).removeClass('low-time');
        }
    }

    function handleTimeOut(color) {
        stopClocks();
        let title = "Time Out!";
        let message = color === 'w' ? "Black wins on time!" : "White wins on time!";
        showGameOverModal(title, message);
        $engineStatusLabel.text(title + " " + message);
    }

    // Sidebar Interactive Events
    $('#btn-new-game').on('click', function() {
        resetGame();
        if (currentGameMode === 'computer') {
            if (playerColor === 'black') {
                board.orientation('black');
                setTimeout(makeEngineFirstMove, 500);
            } else {
                board.orientation('white');
                startClockTicking();
            }
        } else if (currentGameMode === '1v1') {
            board.orientation('white');
            startClockTicking();
        }
    });

    $('#btn-flip-board').on('click', function() {
        board.flip();
    });

    $('#btn-undo').on('click', function() {
        if (currentGameMode === '1v1') {
            if (game.history().length >= 1) {
                game.undo();
                board.position(game.fen());
                
                updateMoveHistoryTable();
                startClockTicking();
            }
        } else if (currentGameMode === 'computer') {
            if (game.history().length >= 2) {
                game.undo();
                game.undo();
                board.position(game.fen());

                // Remove last 2 moves from history tracking
                evalHistory.pop();
                evalHistory.pop();
                moveClassifications.pop();
                moveClassifications.pop();

                updateClassificationCounts();
                updateMoveHistoryTable();
                startClockTicking();

                // Reset evaluation bar to last tracked evaluation
                if (evalHistory.length > 0) {
                    const lastEval = evalHistory[evalHistory.length - 1];
                    updateEvalBar(lastEval / 100.0, "cp");
                } else {
                    updateEvalBar(0.0, "cp");
                }
            }
        }
    });

    // Resign click handler
    $('#btn-resign').on('click', function() {
        if (game.game_over() || isGameOver) return;
        
        if (isMultiplayerOnline && stompClient && stompClient.connected) {
            stompClient.send('/app/room/' + currentRoomId + '/resign', {}, myPlayerId);
            return;
        }

        let title = "Match Resigned";
        let message = "";
        
        if (currentGameMode === 'computer') {
            if (playerColor === 'white') {
                message = "Black wins by resignation!";
            } else {
                message = "White wins by resignation!";
            }
        } else if (currentGameMode === '1v1') {
            if (game.turn() === 'w') {
                message = "Black wins by resignation!";
            } else {
                message = "White wins by resignation!";
            }
        }
        
        showGameOverModal(title, message);
        $engineStatusLabel.text(title + " - " + message);
    });

    // Selection highlights
    function removeHighlights() {
        $('#chess-board .square-55d63').removeClass('highlight-selected highlight-hint highlight-capture-hint');
    }

    function highlightSquare(square) {
        $('#chess-board .square-' + square).addClass('highlight-selected');
    }

    // Displays no longer visual hint targets
    function highlightPossibleMoves(square) {
        // Disabled visually as requested
    }

    // Capture click/tap on board squares
    $('#chess-board').on('click', '.square-55d63', function() {
        if (currentGameMode === 'analyze' || game.game_over() || isGameOver) return;

        const turn = game.turn();
        
        // Block clicking if playing online multiplayer and it's opponent's turn
        if (isMultiplayerOnline) {
            const currentTurnColor = turn === 'w' ? 'white' : 'black';
            if (myAssignedColor !== currentTurnColor) {
                return;
            }
        }

        // Block clicking if it's the computer's turn in Computer mode
        if (currentGameMode === 'computer') {
            const orientation = board.orientation();
            if ((orientation === 'white' && turn === 'b') || 
                (orientation === 'black' && turn === 'w')) {
                return;
            }
        }

        const square = $(this).attr('data-square');
        const piece = game.get(square);

        if (selectedSquare) {
            if (selectedSquare === square) {
                removeHighlights();
                selectedSquare = null;
                return;
            }

            // If another piece of the active player is clicked, select that piece instead
            if (piece && piece.color === turn) {
                removeHighlights();
                selectedSquare = square;
                highlightSquare(square);
                return;
            }

            // Try to make a move to the clicked target square
            const move = game.move({
                from: selectedSquare,
                to: square,
                promotion: 'q'
            });

            if (move !== null) {
                removeHighlights();
                selectedSquare = null;
                board.position(game.fen());
                handlePlayerMove(move);
            } else {
                // If invalid move and not our own piece, deselect
                removeHighlights();
                selectedSquare = null;
            }
        } else {
            // Select piece if it is the active player's color
            if (piece && piece.color === turn) {
                selectedSquare = square;
                highlightSquare(square);
            }
        }
    });

    // Drag-Drop mechanisms are disabled by draggable: false in config
    function onDragStart(source, piece, position, orientation) {
        return false;
    }
    function onDrop(source, target) {
        return 'snapback';
    }
    function onSnapEnd() {
        board.position(game.fen());
    }

    function handlePlayerMove(move) {
        if (isMultiplayerOnline && stompClient && stompClient.connected) {
            stompClient.send('/app/room/' + currentRoomId + '/move', {}, JSON.stringify({
                roomId: currentRoomId,
                playerId: myPlayerId,
                from: move.from,
                to: move.to,
                san: move.san,
                fen: game.fen(),
                promotion: move.promotion || 'q',
                isCheckmate: game.in_checkmate(),
                isDraw: game.in_draw()
            }));
        }

        if (currentGameMode === '1v1') {
            updateMoveHistoryTable();
            startClockTicking();
            
            if (game.game_over()) {
                handleGameOver();
            }
        } else {
            const beforeScore = evalHistory[evalHistory.length - 1] !== undefined ? evalHistory[evalHistory.length - 1] : 30;
            updateMoveHistoryTable();
            startClockTicking();

            window.setTimeout(function() {
                makeEngineMove(beforeScore, move);
            }, 250);
        }
    }

    // Backend status checks
    function checkStatus() {
        $.ajax({
            url: API_BASE + '/status',
            type: 'GET',
            success: function(data) {
                if (data.running) {
                    $engineStatusDot.removeClass('offline').addClass('online');
                    $engineStatusLabel.text(`Engine Online (max ${data.maxElo} ELO)`);
                } else {
                    setEngineOffline();
                }
            },
            error: function() {
                setEngineOffline();
            }
        });
    }

    function setEngineOffline() {
        $engineStatusDot.removeClass('online').addClass('offline');
        $engineStatusLabel.text("Engine Connection Lost");
    }

    function updateEngineConfiguration() {
        const elo = parseInt($eloSlider.val());
        $.ajax({
            url: API_BASE + '/config',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                elo: elo,
                threads: 2,
                hashSizeMb: 64,
                limitStrength: elo < 3200
            }),
            success: function() {
                console.log("Configured engine ELO successfully to " + elo);
            },
            error: function() {
                console.error("Failed to update engine ELO configuration");
            }
        });
    }

    function makeEngineFirstMove() {
        if ($('#game-view').is(':hidden')) return; // Guard: exited to menu
        
        $engineStatusLabel.text("Engine calculating first move...");
        $engineStatusDot.addClass('online');
        startClockTicking();

        const eloVal = parseInt($eloSlider.val());

        $.ajax({
            url: API_BASE + '/best-move',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                fen: game.fen(),
                elo: eloVal,
                movetime: eloVal < 2000 ? 500 : 1000
            }),
            success: function(data) {
                if ($('#game-view').is(':hidden')) return; // Guard: exited to menu
                
                const from = data.bestMove.substring(0, 2);
                const to = data.bestMove.substring(2, 4);
                const promo = data.bestMove.length > 4 ? data.bestMove.charAt(4) : null;

                const engineMoveObj = game.move({
                    from: from,
                    to: to,
                    promotion: promo || 'q'
                });

                if (engineMoveObj) {
                    board.position(game.fen());
                    evalHistory.push(30);
                    moveClassifications.push({
                        type: 'book',
                        label: 'Book',
                        icon: 'fa-book',
                        class: 'move-book',
                        desc: 'Opening book move'
                    });
                    updateClassificationCounts();
                    updateMoveHistoryTable();
                }

                $engineStatusLabel.text(`Engine Ready (${$eloSlider.val()} ELO)`);
                startClockTicking();
            },
            error: function() {
                if ($('#game-view').is(':hidden')) return;
                setEngineOffline();
                $engineStatusLabel.text("Error calculating move");
            }
        });
    }

    function makeEngineMove(playerBeforeScore, playerMove) {
        if (game.game_over() || isGameOver) {
            handleGameOver();
            return;
        }
        if ($('#game-view').is(':hidden')) return; // Guard: exited to menu

        $engineStatusLabel.text("Engine calculating...");
        $engineStatusDot.addClass('online');

        const eloVal = parseInt($eloSlider.val());

        $.ajax({
            url: API_BASE + '/best-move',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                fen: game.fen(),
                elo: eloVal,
                movetime: eloVal < 2000 ? 500 : 1000
            }),
            success: function(data) {
                if ($('#game-view').is(':hidden')) return; // Guard: exited to menu
                if (game.game_over() || isGameOver) return;

                const playerAfterScore = getNumericScore(data.scoreType, data.scoreValue);
                evalHistory.push(playerAfterScore);

                const isBook = (game.history().length <= 8);
                const playerClassification = classifyMove(playerBeforeScore, playerAfterScore, playerMove.color === 'w', playerMove, isBook);
                moveClassifications.push(playerClassification);

                updateClassificationCounts();

                const from = data.bestMove.substring(0, 2);
                const to = data.bestMove.substring(2, 4);
                const promo = data.bestMove.length > 4 ? data.bestMove.charAt(4) : null;

                const engineMoveObj = game.move({
                    from: from,
                    to: to,
                    promotion: promo || 'q'
                });

                if (engineMoveObj) {
                    board.position(game.fen());
                    evalHistory.push(playerAfterScore);

                    const engineClassification = classifyMove(playerAfterScore, playerAfterScore, engineMoveObj.color === 'w', engineMoveObj, isBook);
                    moveClassifications.push(engineClassification);

                    updateClassificationCounts();
                    updateMoveHistoryTable();
                }

                $depthStat.text(data.depth || 0);
                $npsStat.text(formatNps(data.nps || 0));
                $nodesStat.text(formatNumber(data.nodes || 0));
                $timeStat.text((data.timeMs / 1000.0).toFixed(2) + 's');

                parseAndRenderScore(data);

                $engineStatusLabel.text(`Engine Ready (${$eloSlider.val()} ELO)`);
                startClockTicking();

                if (game.game_over()) {
                    handleGameOver();
                }
            },
            error: function() {
                if ($('#game-view').is(':hidden')) return;
                setEngineOffline();
                $engineStatusLabel.text("Error calculating move");
            }
        });
    }

    // Helper functions for scoring & classification
    function getNumericScore(scoreType, scoreValue) {
        if (scoreType === 'mate') {
            if (scoreValue > 0) {
                return 10000 - scoreValue;
            } else {
                return -10000 - scoreValue;
            }
        }
        return scoreValue;
    }

    // Sacrifice detection
    function detectSacrifice(move) {
        if (!move) return false;
        
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        const pieceVal = values[move.piece];
        
        if (pieceVal <= 1) return false;
        
        const opponentMoves = game.moves({ verbose: true });
        for (let i = 0; i < opponentMoves.length; i++) {
            const opMove = opponentMoves[i];
            if (opMove.to === move.to && opMove.captured) {
                const attackerVal = values[opMove.piece];
                if (attackerVal < pieceVal) {
                    return true;
                }
            }
        }
        return false;
    }

    function classifyMove(beforeScore, afterScore, isWhite, move, isBook) {
        const delta = isWhite ? (afterScore - beforeScore) : (beforeScore - afterScore);
        const pawnDelta = delta / 100.0;

        if (isBook && pawnDelta >= -0.3) {
            return {
                type: 'book',
                label: 'Book',
                icon: 'fa-book',
                class: 'move-book',
                desc: 'Opening book move'
            };
        }

        if (pawnDelta <= -1.5) {
            return {
                type: 'blunder',
                label: 'Blunder',
                icon: 'fa-circle-xmark',
                class: 'move-blunder',
                desc: 'A major mistake that loses significant advantage'
            };
        }
        if (pawnDelta <= -0.8) {
            return {
                type: 'mistake',
                label: 'Mistake',
                icon: 'fa-circle-question',
                class: 'move-mistake',
                desc: 'A bad move that worsens your position'
            };
        }
        if (pawnDelta <= -0.4) {
            return {
                type: 'inaccuracy',
                label: 'Inaccuracy',
                icon: 'fa-circle-question',
                class: 'move-inaccuracy',
                desc: 'A slip that gives away some of your advantage'
            };
        }

        if (detectSacrifice(move) && pawnDelta >= -0.15) {
            return {
                type: 'brilliant',
                label: 'Brilliant',
                icon: 'fa-bolt',
                class: 'move-brilliant',
                desc: 'A spectacular move that sacrifices material for a tactical advantage!'
            };
        }

        if (pawnDelta >= 0.5) {
            return {
                type: 'great',
                label: 'Great Move',
                icon: 'fa-award',
                class: 'move-great',
                desc: 'An excellent find that improves your position significantly'
            };
        }

        if (pawnDelta >= -0.05) {
            return {
                type: 'best',
                label: 'Best Move',
                icon: 'fa-star',
                class: 'move-best',
                desc: 'The best move in the position'
            };
        }

        if (pawnDelta >= -0.15) {
            return {
                type: 'excellent',
                label: 'Excellent',
                icon: 'fa-thumbs-up',
                class: 'move-excellent',
                desc: 'A very strong move'
            };
        }

        return {
            type: 'good',
            label: 'Good',
            icon: 'fa-check',
            class: 'move-good',
            desc: 'A solid move'
        };
    }

    function updateClassificationCounts() {
        const counts = {
            w: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
            b: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
        };

        for (let i = 0; i < moveClassifications.length; i++) {
            const side = (i % 2 === 0) ? 'w' : 'b';
            const cls = moveClassifications[i];
            if (cls && counts[side][cls.type] !== undefined) {
                counts[side][cls.type]++;
            }
        }

        const categories = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'blunder'];
        categories.forEach(cat => {
            $(`#cnt-w-${cat}`).text(counts.w[cat]);
            $(`#cnt-b-${cat}`).text(counts.b[cat]);
        });
    }

    // Evaluation Bar update logic
    function parseAndRenderScore(data) {
        let val = 0.0;
        let scoreType = data.scoreType || "cp";
        let scoreValue = data.scoreValue || 0;

        if (scoreType === "cp") {
            val = scoreValue / 100.0;
        } else {
            val = scoreValue;
        }

        updateEvalBar(val, scoreType);
    }

    function updateEvalBar(val, type, numericScore) {
        let percent = 50;

        if (type === "cp") {
            percent = 50 + (val / 8.0) * 50;
            percent = Math.max(5, Math.min(95, percent));
            
            let absVal = Math.abs(val).toFixed(2);
            $evaluationText.text(val >= 0 ? '+' + absVal : '-' + absVal);
        } else {
            let isWhiteAdvantage = false;
            if (numericScore !== undefined) {
                isWhiteAdvantage = (numericScore > 0);
            } else {
                isWhiteAdvantage = (val > 0);
            }

            const moves = Math.abs(val);
            if (isWhiteAdvantage) {
                percent = 98;
                $evaluationText.text("M" + moves);
            } else {
                percent = 2;
                $evaluationText.text("-M" + moves);
            }
        }

        let fillHeight = 100 - percent;
        $evaluationBar.find('.eval-fill-black').css('height', fillHeight + '%');

        if (percent >= 50) {
            $evaluationText.removeClass('black-advantage');
        } else {
            $evaluationText.addClass('black-advantage');
        }
    }

    // Helper utilities
    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000.0).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000.0).toFixed(1) + 'k';
        return num;
    }

    // NPS formatting
    function formatNps(nps) {
        if (nps >= 1000000) return (nps / 1000000.0).toFixed(1) + ' Mn/s';
        if (nps >= 1000) return (nps / 1000.0).toFixed(1) + ' kn/s';
        return nps + ' n/s';
    }

    // Update table
    function updateMoveHistoryTable() {
        $moveHistoryBody.empty();
        const history = game.history({ verbose: true });
        
        let rowCount = 1;
        for (let i = 0; i < history.length; i += 2) {
            const whiteMove = history[i].san;
            const blackMove = (i + 1 < history.length) ? history[i + 1].san : '';
            
            const whiteCls = moveClassifications[i];
            const blackCls = (i + 1 < moveClassifications.length) ? moveClassifications[i + 1] : null;

            let whiteBadgeHtml = '';
            if (whiteCls) {
                whiteBadgeHtml = `<span class="move-badge ${whiteCls.class}" title="${whiteCls.desc}"><i class="fa-solid ${whiteCls.icon}"></i></span>`;
            }

            let blackBadgeHtml = '';
            if (blackCls) {
                blackBadgeHtml = `<span class="move-badge ${blackCls.class}" title="${blackCls.desc}"><i class="fa-solid ${blackCls.icon}"></i></span>`;
            }

            const tr = `
                <tr>
                    <td class="move-log-num">${rowCount}</td>
                    <td class="move-log-item">${whiteMove} ${whiteBadgeHtml}</td>
                    <td class="move-log-item">${blackMove} ${blackBadgeHtml}</td>
                </tr>
            `;
            $moveHistoryBody.append(tr);
            rowCount++;
        }

        const container = document.getElementById('move-log');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function resetGame() {
        game.reset();
        board.start();
        
        selectedSquare = null;
        evalHistory = [30];
        moveClassifications = [];
        isGameOver = false; // Reset game state flag
        removeHighlights();
        updateClassificationCounts();
        $('#btn-sidebar-analyze').hide();
        
        $moveHistoryBody.empty();
        $depthStat.text('0');
        $npsStat.text('0');
        $nodesStat.text('0');
        $timeStat.text('0.0s');
        updateEvalBar(0.0, "cp");
        $engineStatusLabel.text(`Engine Ready (${$eloSlider.val()} ELO)`);
        checkStatus();
    }

    function showGameOverModal(title, message) {
        stopClocks();
        $('#modal-title').text(title);
        $('#modal-message').text(message);
        $('#copy-pgn-toast').hide(); // Hide toast initially
        $('#btn-sidebar-analyze').show(); // Allow direct analysis from sidebar after modal close
        $('#game-over-modal').fadeIn(300);
        
        isGameOver = true; // Use boolean flag to block clicks instead of game.load empty board FEN!
    }

    function handleGameOver() {
        stopClocks();
        let title = "Game Over";
        let message = "Draw!";
        if (game.in_checkmate()) {
            title = "Checkmate!";
            message = game.turn() === 'w' ? "Black wins." : "White wins.";
        } else if (game.in_draw()) {
            message = "Draw!";
        }
        showGameOverModal(title, message);
        $engineStatusLabel.text(title + " " + message);
    }

    // PGN Bulk Analysis & Stepping Logic
    function startBulkAnalysis(movesList) {
        $engineStatusLabel.text("Analyzing game moves (0/" + movesList.length + ")...");
        $engineStatusDot.addClass('online');
        
        isAnalysisComplete = false;
        analysisHistory = [];
        analysisEvaluations = [];
        analysisClassifications = [];
        
        // Add start position
        analysisHistory.push('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        analysisEvaluations.push({ score: 30, type: 'cp', value: 30 });
        analysisClassifications.push({
            type: 'book',
            label: 'Book',
            icon: 'fa-book',
            class: 'move-book',
            desc: 'Starting Position'
        });
        
        const tempGame = new Chess();
        const positionsToQuery = [];
        
        for (let i = 0; i < movesList.length; i++) {
            tempGame.move(movesList[i].san);
            positionsToQuery.push({
                fen: tempGame.fen(),
                move: movesList[i],
                inCheckmate: tempGame.in_checkmate(),
                inDraw: tempGame.in_draw()
            });
        }
        
        let idx = 0;
        
        function processNextPosition() {
            if (idx >= positionsToQuery.length) {
                completeAnalysis();
                return;
            }
            
            const pct = Math.round((idx / positionsToQuery.length) * 100);
            $engineStatusLabel.text(`Analyzing move ${idx + 1} of ${positionsToQuery.length} (${pct}%)`);
            
            const target = positionsToQuery[idx];
            
            $.ajax({
                url: API_BASE + '/best-move',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    fen: target.fen,
                    elo: 3200,
                    movetime: 200 // Faster calculations for rapid load times
                }),
                success: function(data) {
                    let score;
                    let sType = data.scoreType || 'cp';
                    let sVal = data.scoreValue || 0;
                    
                    if (target.inCheckmate) {
                        score = (target.move.color === 'w') ? 10000 : -10000;
                        sType = 'mate';
                        sVal = 0;
                    } else if (target.inDraw) {
                        score = 0;
                        sType = 'cp';
                        sVal = 0;
                    } else {
                        score = getNumericScore(sType, sVal);
                    }
                    analysisHistory.push(target.fen);
                    analysisEvaluations.push({ score: score, type: sType, value: sVal });
                    
                    const prevScore = analysisEvaluations[idx].score;
                    const isWhite = (idx % 2 === 0);
                    const isBook = (idx < 8);
                    
                    const classification = classifyMove(prevScore, score, isWhite, target.move, isBook);
                    analysisClassifications.push(classification);
                    
                    idx++;
                    processNextPosition();
                },
                error: function() {
                    // Fallback to avoid breaking execution flow
                    analysisHistory.push(target.fen);
                    const prevEval = analysisEvaluations[idx];
                    analysisEvaluations.push({ score: prevEval.score, type: prevEval.type, value: prevEval.value });
                    analysisClassifications.push({
                        type: 'good',
                        label: 'Good',
                        icon: 'fa-check',
                        class: 'move-good',
                        desc: 'A solid move'
                    });
                    idx++;
                    processNextPosition();
                }
            });
        }
        
        processNextPosition();
    }

    function completeAnalysis() {
        isAnalysisComplete = true;
        $engineStatusLabel.text("Analysis Complete!");
        
        updateClassificationCountsFromList(analysisClassifications);
        
        // Calculate Accuracy Percentage
        let whitePoints = 0, whiteCount = 0;
        let blackPoints = 0, blackCount = 0;
        
        const badgeWeights = {
            brilliant: 100,
            best: 100,
            great: 100,
            excellent: 95,
            good: 85,
            book: 100,
            inaccuracy: 50,
            mistake: 25,
            blunder: 0
        };
        
        for (let i = 0; i < analysisClassifications.length; i++) {
            const cls = analysisClassifications[i];
            const weight = badgeWeights[cls.type] !== undefined ? badgeWeights[cls.type] : 85;
            
            if (i % 2 === 0) {
                whitePoints += weight;
                whiteCount++;
            } else {
                blackPoints += weight;
                blackCount++;
            }
        }
        
        const whiteAcc = whiteCount > 0 ? Math.round(whitePoints / whiteCount) : 100;
        const blackAcc = blackCount > 0 ? Math.round(blackPoints / blackCount) : 100;
        
        $('#acc-val-white').text(whiteAcc + '%');
        $('#acc-val-black').text(blackAcc + '%');
        
        setAccuracyRing($('#acc-ring-white'), whiteAcc);
        setAccuracyRing($('#acc-ring-black'), blackAcc);
        
        renderMoveHistoryFromList(analysisMoves, analysisClassifications);
        
        // Parse clocks from PGN comments
        const pgnText = $('#pgn-textarea').val();
        const movesText = pgnText.replace(/\[[^\]]+\]/g, '').replace(/\r?\n/g, ' ').trim();
        const commentRegex = /\{([^}]+)\}/g;
        let commentMatch;
        const pgnComments = [];
        while ((commentMatch = commentRegex.exec(movesText)) !== null) {
            pgnComments.push(commentMatch[1]);
        }
        
        analysisClocks = [];
        for (let i = 0; i < analysisMoves.length; i++) {
            let clockVal = null;
            if (i < pgnComments.length) {
                const clkMatch = pgnComments[i].match(/\[%clk\s+([0-9:]+)\]/);
                if (clkMatch) {
                    clockVal = clkMatch[1];
                }
            }
            analysisClocks.push(clockVal);
        }
        
        analysisIndex = 0;
        showAnalysisPosition(0);
    }

    function setAccuracyRing($ring, percent) {
        const circumference = 188.5; // 2 * pi * r (r=30)
        const offset = circumference - (percent / 100) * circumference;
        $ring.css('stroke-dashoffset', offset);
    }

    function updateClassificationCountsFromList(list) {
        const counts = {
            w: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
            b: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
        };

        for (let i = 0; i < list.length; i++) {
            const side = (i % 2 === 0) ? 'w' : 'b';
            const cls = list[i];
            if (cls && counts[side][cls.type] !== undefined) {
                counts[side][cls.type]++;
            }
        }

        const categories = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'blunder'];
        categories.forEach(cat => {
            $(`#cnt-w-${cat}`).text(counts.w[cat]);
            $(`#cnt-b-${cat}`).text(counts.b[cat]);
        });
    }

    function renderMoveHistoryFromList(moves, classifications) {
        $moveHistoryBody.empty();
        
        let rowCount = 1;
        for (let i = 0; i < moves.length; i += 2) {
            const whiteMove = moves[i].san;
            const blackMove = (i + 1 < moves.length) ? moves[i + 1].san : '';
            
            const whiteCls = classifications[i];
            const blackCls = (i + 1 < classifications.length) ? classifications[i + 1] : null;

            let whiteBadgeHtml = '';
            if (whiteCls && whiteCls.type !== 'good') {
                whiteBadgeHtml = `<span class="move-badge ${whiteCls.class}" title="${whiteCls.desc}"><i class="fa-solid ${whiteCls.icon}"></i></span>`;
            }

            let blackBadgeHtml = '';
            if (blackCls && blackCls.type !== 'good') {
                blackBadgeHtml = `<span class="move-badge ${blackCls.class}" title="${blackCls.desc}"><i class="fa-solid ${blackCls.icon}"></i></span>`;
            }

            const tr = `
                <tr>
                    <td class="move-log-num">${rowCount}</td>
                    <td class="move-log-item w-move" data-index="${i + 1}">${whiteMove} ${whiteBadgeHtml}</td>
                    <td class="move-log-item b-move" data-index="${i + 2}">${blackMove} ${blackBadgeHtml}</td>
                </tr>
            `;
            $moveHistoryBody.append(tr);
            rowCount++;
        }

        // Add interactive jump clicks to moves
        $moveHistoryBody.find('.w-move').on('click', function() {
            const index = parseInt($(this).data('index'));
            if (index < analysisHistory.length) {
                showAnalysisPosition(index);
            }
        });
        
        $moveHistoryBody.find('.b-move').on('click', function() {
            const index = parseInt($(this).data('index'));
            if (index < analysisHistory.length) {
                showAnalysisPosition(index);
            }
        });
    }

    function showAnalysisPosition(index) {
        analysisIndex = index;
        const fen = analysisHistory[index];
        board.position(fen);
        
        // Remove prior active states
        $moveHistoryBody.find('.move-log-item').css('background-color', 'transparent');
        
        // Remove existing board badges
        $('#chess-board .analysis-board-badge').remove();
        
        if (index > 0) {
            const isBlack = (index - 1) % 2 === 1;
            const rowIndex = Math.floor((index - 1) / 2);
            const cellSelector = isBlack ? '.b-move' : '.w-move';
            
            $moveHistoryBody.find('tr').eq(rowIndex).find(cellSelector).css('background-color', 'rgba(6, 182, 212, 0.25)');
            
            // Add quality badge to target square on the board
            const move = analysisMoves[index - 1];
            const cls = analysisClassifications[index - 1];
            if (move && move.to && cls && cls.type) {
                const $squareEl = $('#chess-board .square-' + move.to);
                if ($squareEl.length > 0) {
                    const badgeHtml = `<div class="analysis-board-badge ${cls.class}" title="${cls.label}: ${cls.desc}"><i class="fa-solid ${cls.icon}"></i></div>`;
                    $squareEl.append(badgeHtml);
                }
            }
        }
        
        // Update eval bar
        const evalData = analysisEvaluations[index];
        if (evalData.type === 'cp') {
            updateEvalBar(evalData.value / 100.0, 'cp');
        } else {
            updateEvalBar(evalData.value, 'mate', evalData.score);
        }
        
        // Update clock displays in PGN Analysis Mode
        let whiteClockText = '--:--';
        let blackClockText = '--:--';
        
        for (let i = index; i > 0; i--) {
            const isWhiteMove = (i - 1) % 2 === 0;
            const clockVal = analysisClocks[i - 1];
            if (clockVal) {
                if (isWhiteMove && whiteClockText === '--:--') {
                    whiteClockText = formatPgnClock(clockVal);
                } else if (!isWhiteMove && blackClockText === '--:--') {
                    blackClockText = formatPgnClock(clockVal);
                }
            }
            if (whiteClockText !== '--:--' && blackClockText !== '--:--') {
                break;
            }
        }
        
        $('#clock-white').text(whiteClockText);
        $('#clock-black').text(blackClockText);
        
        // Update stepper labels
        $('#stepper-info-text').text(`Move ${index} of ${analysisHistory.length - 1}`);
        
        if (index > 0) {
            const cls = analysisClassifications[index - 1];
            if (cls) {
                $engineStatusLabel.text(`Move ${index}: ${cls.label} - ${cls.desc}`);
            }
        } else {
            $engineStatusLabel.text("Starting Position");
        }
    }

    // Bind Navigation buttons for Analysis stepper
    $('#btn-step-first').on('click', function() {
        if (!isAnalysisComplete) return;
        showAnalysisPosition(0);
    });

    $('#btn-step-prev').on('click', function() {
        if (!isAnalysisComplete) return;
        if (analysisIndex > 0) {
            showAnalysisPosition(analysisIndex - 1);
        }
    });

    $('#btn-step-next').on('click', function() {
        if (!isAnalysisComplete) return;
        if (analysisIndex < analysisHistory.length - 1) {
            showAnalysisPosition(analysisIndex + 1);
        }
    });

    $('#btn-step-last').on('click', function() {
        if (!isAnalysisComplete) return;
        showAnalysisPosition(analysisHistory.length - 1);
    });

    // Custom Modal Handlers
    $('#btn-modal-rematch').on('click', function() {
        $('#game-over-modal').fadeOut(200);
        resetGame();
        if (currentGameMode === 'computer') {
            if (playerColor === 'black') {
                board.orientation('black');
                setTimeout(makeEngineFirstMove, 500);
            } else {
                board.orientation('white');
                startClockTicking();
            }
        } else if (currentGameMode === '1v1') {
            board.orientation('white');
            startClockTicking();
        }
    });

    $('#btn-modal-menu').on('click', function() {
        $('#game-over-modal').fadeOut(200);
        showWelcomeView();
    });

    function buildPgnFromHistory(moves) {
        if (!moves || moves.length === 0) return "";
        let pgn = '[Event "Chess Engine Match"]\n';
        pgn += '[Site "Chess Platform"]\n';
        pgn += '[Date "' + new Date().toISOString().split('T')[0] + '"]\n';
        pgn += '[White "White Player"]\n';
        pgn += '[Black "Black Player"]\n';
        pgn += '[Result "*"]\n\n';
        
        let moveNum = 1;
        for (let i = 0; i < moves.length; i++) {
            if (i % 2 === 0) {
                pgn += moveNum + '. ' + moves[i].san + ' ';
            } else {
                pgn += moves[i].san + ' ';
                moveNum++;
            }
        }
        return pgn.trim();
    }

    function exportAndStartAnalysis(customPgn) {
        const movesList = game.history({ verbose: true });
        let pgnText = customPgn || game.pgn();

        if ((!pgnText || pgnText.trim().length === 0) && movesList.length > 0) {
            pgnText = buildPgnFromHistory(movesList);
        }

        if (!movesList || movesList.length === 0) {
            alert("No moves recorded in this game to analyze.");
            return;
        }

        $('#game-over-modal').fadeOut(200);
        $('#pgn-textarea').val(pgnText);

        showGameView('analyze');

        // Configure player names
        let whiteName = 'White Player';
        let blackName = 'Black Player';
        if (currentGameMode === 'computer') {
            if (playerColor === 'white') {
                whiteName = 'You (White)';
                blackName = `Stockfish (${$eloSlider.val()} ELO)`;
            } else {
                whiteName = `Stockfish (${$eloSlider.val()} ELO)`;
                blackName = 'You (Black)';
            }
        }

        $('#player-name').text(whiteName);
        $('#opponent-name').text(blackName);

        analysisMoves = movesList;
        game.reset();
        board.start();

        // Start engine analysis automatically
        startBulkAnalysis(analysisMoves);
    }

    $('#btn-modal-analyze').on('click', function(e) {
        e.preventDefault();
        exportAndStartAnalysis();
    });

    $('#btn-sidebar-analyze').on('click', function(e) {
        e.preventDefault();
        exportAndStartAnalysis();
    });

    $('#btn-modal-copy-pgn').on('click', function() {
        const pgn = game.pgn();
        navigator.clipboard.writeText(pgn).then(function() {
            $('#copy-pgn-toast').fadeIn(200);
            setTimeout(function() {
                $('#copy-pgn-toast').fadeOut(300);
            }, 2500);
        }).catch(function(err) {
            console.error('Failed to copy PGN: ', err);
            // Fallback
            const $temp = $('<textarea>');
            $('body').append($temp);
            $temp.val(pgn).select();
            document.execCommand('copy');
            $temp.remove();
            
            $('#copy-pgn-toast').fadeIn(200);
            setTimeout(function() {
                $('#copy-pgn-toast').fadeOut(300);
            }, 2500);
        });
    });

    // Helper to format PGN clock parameter
    function formatPgnClock(clk) {
        if (clk.startsWith('0:')) {
            return clk.substring(2);
        }
        return clk;
    }
});
