// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "./utils/MinimalForwarder.sol";

/**
 * @title PrizePoolPredictionGasless
 * @dev Gasless version of PrizePoolPrediction using EIP-2771 meta-transactions
 * Users can interact without paying gas fees - a relayer pays on their behalf
 */
contract PrizePoolPredictionGasless is ReentrancyGuard, ERC2771Context {
    
    struct Prediction {
        uint256 id;
        string question;
        string[] options; 
        uint256 entryFee;
        uint256 prizePool;
        uint256 endTime;
        uint256 resolutionTime;
        bool resolved;
        uint256 winningOption;
        bool active;
        address creator;
        uint256 totalParticipants;
    }
    
    struct UserPrediction {
        uint256 option; 
        bool claimed;
        uint256 timestamp;
    }
    
    struct UserStats {
        uint256 totalPredictions;
        uint256 correctPredictions;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 totalWinnings;
        uint256 lastPredictionTime;
        bool hasStreakSaver;
        uint256 totalPoints;
    }
    
    struct Dispute {
        uint256 predictionId;
        address challenger;
        uint256 proposedWinningOption;
        uint256 votesForCreator;
        uint256 votesForChallenger;
        uint256 totalVotes;
        bool resolved;
        uint256 deadline;
        mapping(address => bool) hasVoted;
        mapping(address => bool) votedForCreator;
    }
    
    // State variables
    uint256 public predictionCounter;
    uint256 public platformFee = 500; // 5%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public streakSaverPrice = 0.01 ether;
    uint256 public disputeStake = 0.01 ether;
    uint256 public disputeVotingPeriod = 3 days;
    
    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => mapping(address => UserPrediction)) public userPredictions;
    mapping(uint256 => mapping(uint256 => address[])) public optionParticipants;
    mapping(uint256 => mapping(uint256 => uint256)) public optionCounts;
    mapping(address => uint256[]) public userParticipatedPredictions;
    mapping(address => UserStats) public userStats;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => bool) public hasDispute;
    
    // Leaderboard arrays
    address[] public streakLeaders;
    address[] public winningsLeaders;
    address[] public accuracyLeaders;
    address[] public pointsLeaders;
    
    // Events
    event PredictionCreated(
        uint256 indexed predictionId,
        string question,
        string[] options,
        uint256 entryFee,
        uint256 prizePool,
        uint256 endTime,
        address indexed creator
    );
    
    event PredictionSubmitted(
        uint256 indexed predictionId,
        address indexed user,
        uint256 option,
        string optionText
    );
    
    event PredictionResolved(
        uint256 indexed predictionId,
        uint256 winningOption,
        string winningOptionText,
        uint256 winnersCount
    );
    
    event PrizesClaimed(
        uint256 indexed predictionId,
        address indexed user,
        uint256 amount
    );
    
    event PrizesDistributed(
        uint256 indexed predictionId,
        uint256 totalWinners,
        uint256 totalPrizeDistributed,
        uint256 platformFeeCollected
    );
    
    event PrizePoolIncreased(
        uint256 indexed predictionId,
        uint256 additionalAmount,
        uint256 newTotal
    );
    
    event StreakUpdated(
        address indexed user,
        uint256 newStreak,
        bool isCorrect,
        bool streakSaverUsed
    );
    
    event StreakSaverPurchased(
        address indexed user
    );
    
    event LeaderboardUpdated(
        address indexed user,
        string leaderboardType
    );
    
    event DisputeCreated(
        uint256 indexed predictionId,
        address indexed challenger,
        uint256 proposedWinningOption,
        uint256 stake
    );
    
    event DisputeVote(
        uint256 indexed predictionId,
        address indexed voter,
        bool votedForCreator,
        uint256 stake
    );
    
    event DisputeResolved(
        uint256 indexed predictionId,
        bool creatorWon,
        uint256 finalWinningOption,
        uint256 totalVotes
    );
    
    /**
     * @dev Constructor that sets up the trusted forwarder for meta-transactions
     * @param trustedForwarder Address of the MinimalForwarder contract
     */
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}
    
    /**
     * @dev Override _msgSender() to get the real sender from meta-transaction
     * This is crucial for gasless transactions
     */
    function _msgSender() internal view virtual override(ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }
    
    /**
     * @dev Override _msgData() to get the real data from meta-transaction
     */
    function _msgData() internal view virtual override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
    
    // Create a new prediction
    function createPrediction(
        string memory _question,
        string[] memory _options,
        uint256 _entryFee,
        uint256 _endTime,
        uint256 _resolutionTime
    ) external payable returns (uint256) {
        require(_endTime > block.timestamp, "End time must be in future");
        require(_resolutionTime > _endTime, "Resolution time must be after end time");
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(_options.length >= 2, "Must have at least 2 options");
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(msg.value > 0, "Must provide initial prize pool");
        require(_endTime - block.timestamp >= 1 hours, "Prediction must last at least 1 hour");
        require(_resolutionTime - _endTime >= 1 hours, "Resolution period must be at least 1 hour");
        
        predictionCounter++;
        
        predictions[predictionCounter] = Prediction({
            id: predictionCounter,
            question: _question,
            options: _options,
            entryFee: _entryFee,
            prizePool: msg.value,
            endTime: _endTime,
            resolutionTime: _resolutionTime,
            resolved: false,
            winningOption: 0,
            active: true,
            creator: _msgSender(), // Use _msgSender() instead of msg.sender
            totalParticipants: 0
        });
        
        emit PredictionCreated(
            predictionCounter, 
            _question, 
            _options, 
            _entryFee, 
            msg.value, 
            _endTime,
            _msgSender()
        );
        
        userStats[_msgSender()].totalPoints += 10;
        _updateLeaderboards(_msgSender());
        
        return predictionCounter;
    }
    
    // Submit a prediction
    function submitPrediction(uint256 _predictionId, uint256 _optionIndex) 
        external 
        payable 
        nonReentrant 
    {
        Prediction storage prediction = predictions[_predictionId];
        address sender = _msgSender(); // Get real sender
        
        require(prediction.active, "Prediction not active");
        require(!prediction.resolved, "Prediction already resolved");
        require(block.timestamp < prediction.endTime, "Prediction period ended");
        require(_optionIndex < prediction.options.length, "Invalid option");
        require(msg.value == prediction.entryFee, "Incorrect entry fee");
        require(userPredictions[_predictionId][sender].timestamp == 0, "Already predicted");
        require(sender != prediction.creator, "Creator cannot predict on own prediction");
        
        userPredictions[_predictionId][sender] = UserPrediction({
            option: _optionIndex,
            claimed: false,
            timestamp: block.timestamp
        });
        
        optionParticipants[_predictionId][_optionIndex].push(sender);
        optionCounts[_predictionId][_optionIndex]++;
        
        prediction.totalParticipants++;
        prediction.prizePool += msg.value;
        
        userParticipatedPredictions[sender].push(_predictionId);
        
        userStats[sender].totalPredictions++;
        userStats[sender].lastPredictionTime = block.timestamp;
        
        emit PredictionSubmitted(
            _predictionId, 
            sender, 
            _optionIndex, 
            prediction.options[_optionIndex]
        );
        
        userStats[sender].totalPoints += 5;
        _updateLeaderboards(sender);
    }
    
    // Resolve a prediction
    function resolvePrediction(uint256 _predictionId, uint256 _winningOption) external {
        Prediction storage prediction = predictions[_predictionId];
        address sender = _msgSender();
        
        require(prediction.active, "Prediction not active");
        require(!prediction.resolved, "Already resolved");
        require(block.timestamp >= prediction.endTime, "Prediction period not ended");
        require(block.timestamp <= prediction.resolutionTime + 7 days, "Resolution period expired");
        require(_winningOption < prediction.options.length, "Invalid winning option");
        require(sender == prediction.creator, "Only creator can resolve initially");
        require(!hasDispute[_predictionId], "Cannot resolve while dispute is active");
        
        prediction.resolved = true;
        prediction.winningOption = _winningOption;
        
        _distributePrizes(_predictionId, _winningOption);
        _updateStreaksAfterResolution(_predictionId, _winningOption);
        
        emit PredictionResolved(
            _predictionId, 
            _winningOption, 
            prediction.options[_winningOption],
            optionCounts[_predictionId][_winningOption]
        );
    }
    
    // Internal function to distribute prizes
    function _distributePrizes(uint256 _predictionId, uint256 _winningOption) internal {
        Prediction memory prediction = predictions[_predictionId];
        uint256 winnersCount = optionCounts[_predictionId][_winningOption];
        
        if (winnersCount == 0) {
            _refundEntryFees(_predictionId);
            return;
        }
        
        uint256 totalPrize = prediction.prizePool;
        uint256 platformFeeAmount = (totalPrize * platformFee) / BASIS_POINTS;
        uint256 winnersShare = totalPrize - platformFeeAmount;
        uint256 basePrize = winnersShare / winnersCount;
        
        uint256 totalDistributed = 0;
        uint256 actualWinners = 0;
        
        address[] memory winners = optionParticipants[_predictionId][_winningOption];
        
        for (uint256 i = 0; i < winners.length; i++) {
            address winner = winners[i];
            UserPrediction storage userPred = userPredictions[_predictionId][winner];
            
            if (userPred.timestamp > 0 && !userPred.claimed) {
                uint256 streakMultiplier = _calculateStreakMultiplier(winner);
                uint256 finalPrize = (basePrize * streakMultiplier) / BASIS_POINTS;
                
                userPred.claimed = true;
                userStats[winner].totalWinnings += finalPrize;
                
                payable(winner).transfer(finalPrize);
                
                totalDistributed += finalPrize;
                actualWinners++;
                
                emit PrizesClaimed(_predictionId, winner, finalPrize);
            }
        }
        
        emit PrizesDistributed(_predictionId, actualWinners, totalDistributed, platformFeeAmount);
    }
    
    // Internal function to refund entry fees
    function _refundEntryFees(uint256 _predictionId) internal {
        Prediction memory prediction = predictions[_predictionId];
        
        for (uint256 i = 0; i < prediction.options.length; i++) {
            address[] memory participants = optionParticipants[_predictionId][i];
            
            for (uint256 j = 0; j < participants.length; j++) {
                address participant = participants[j];
                UserPrediction storage userPred = userPredictions[_predictionId][participant];
                
                if (userPred.timestamp > 0 && !userPred.claimed) {
                    userPred.claimed = true;
                    payable(participant).transfer(prediction.entryFee);
                }
            }
        }
    }
    
    // Add funds to prize pool
    function increasePrizePool(uint256 _predictionId) external payable {
        Prediction storage prediction = predictions[_predictionId];
        require(prediction.active && !prediction.resolved, "Prediction not active");
        require(msg.value > 0, "Must send some ETH");
        
        prediction.prizePool += msg.value;
        
        emit PrizePoolIncreased(_predictionId, msg.value, prediction.prizePool);
    }
    
    // Buy streak saver
    function buyStreakSaver() external payable {
        address sender = _msgSender();
        require(msg.value >= streakSaverPrice, "Insufficient payment");
        require(!userStats[sender].hasStreakSaver, "Already have streak saver");
        
        userStats[sender].hasStreakSaver = true;
        
        if (msg.value > streakSaverPrice) {
            payable(sender).transfer(msg.value - streakSaverPrice);
        }
        
        emit StreakSaverPurchased(sender);
    }
    
    // Cancel prediction
    function cancelPrediction(uint256 _predictionId) external {
        Prediction storage prediction = predictions[_predictionId];
        address sender = _msgSender();
        
        require(sender == prediction.creator, "Only creator can cancel");
        require(!prediction.resolved, "Cannot cancel resolved prediction");
        require(prediction.totalParticipants == 0, "Cannot cancel with participants");
        require(block.timestamp < prediction.endTime, "Prediction period already started");
        
        prediction.active = false;
        payable(prediction.creator).transfer(prediction.prizePool);
    }
    
    // Update streaks after resolution
    function _updateStreaksAfterResolution(uint256 _predictionId, uint256 _winningOption) internal {
        Prediction memory prediction = predictions[_predictionId];
        
        for (uint256 i = 0; i < prediction.options.length; i++) {
            address[] memory participants = optionParticipants[_predictionId][i];
            
            for (uint256 j = 0; j < participants.length; j++) {
                address participant = participants[j];
                bool isCorrect = (i == _winningOption);
                
                UserStats storage stats = userStats[participant];
                bool streakSaverUsed = false;
                
                if (isCorrect) {
                    stats.correctPredictions++;
                    stats.currentStreak++;
                    
                    if (stats.currentStreak > stats.longestStreak) {
                        stats.longestStreak = stats.currentStreak;
                    }
                    
                    stats.totalPoints += 50;
                } else {
                    if (stats.hasStreakSaver && stats.currentStreak > 0) {
                        stats.hasStreakSaver = false;
                        streakSaverUsed = true;
                    } else {
                        stats.currentStreak = 0;
                    }
                }
                
                emit StreakUpdated(participant, stats.currentStreak, isCorrect, streakSaverUsed);
                _updateLeaderboards(participant);
            }
        }
    }
    
    // Calculate streak multiplier
    function _calculateStreakMultiplier(address _user) internal view returns (uint256) {
        uint256 streak = userStats[_user].currentStreak;
        
        if (streak >= 10) return 20000;
        if (streak >= 5) return 15000;
        if (streak >= 3) return 12000;
        return 10000;
    }
    
    // Update all leaderboards
    function _updateLeaderboards(address _user) internal {
        _updateStreakLeaderboard(_user);
        _updateWinningsLeaderboard(_user);
        _updateAccuracyLeaderboard(_user);
        _updatePointsLeaderboard(_user);
    }
    
    function _updateStreakLeaderboard(address _user) internal {
        uint256 userStreak = userStats[_user].currentStreak;
        
        for (uint256 i = 0; i < streakLeaders.length; i++) {
            if (streakLeaders[i] == _user) {
                _reorderStreakLeaderboard(i);
                return;
            }
        }
        
        if (streakLeaders.length < 10) {
            streakLeaders.push(_user);
            _reorderStreakLeaderboard(streakLeaders.length - 1);
        } else {
            uint256 lowestStreak = userStats[streakLeaders[9]].currentStreak;
            if (userStreak > lowestStreak) {
                streakLeaders[9] = _user;
                _reorderStreakLeaderboard(9);
            }
        }
        
        emit LeaderboardUpdated(_user, "streak");
    }
    
    function _reorderStreakLeaderboard(uint256 _startIndex) internal {
        for (uint256 i = _startIndex; i > 0; i--) {
            uint256 currentStreak = userStats[streakLeaders[i]].currentStreak;
            uint256 previousStreak = userStats[streakLeaders[i-1]].currentStreak;
            
            if (currentStreak > previousStreak) {
                address temp = streakLeaders[i];
                streakLeaders[i] = streakLeaders[i-1];
                streakLeaders[i-1] = temp;
            } else {
                break;
            }
        }
    }
    
    function _updateWinningsLeaderboard(address _user) internal {
        uint256 userWinnings = userStats[_user].totalWinnings;
        
        for (uint256 i = 0; i < winningsLeaders.length; i++) {
            if (winningsLeaders[i] == _user) {
                _reorderWinningsLeaderboard(i);
                return;
            }
        }
        
        if (winningsLeaders.length < 10) {
            winningsLeaders.push(_user);
            _reorderWinningsLeaderboard(winningsLeaders.length - 1);
        } else {
            uint256 lowestWinnings = userStats[winningsLeaders[9]].totalWinnings;
            if (userWinnings > lowestWinnings) {
                winningsLeaders[9] = _user;
                _reorderWinningsLeaderboard(9);
            }
        }
        
        emit LeaderboardUpdated(_user, "winnings");
    }
    
    function _reorderWinningsLeaderboard(uint256 _startIndex) internal {
        for (uint256 i = _startIndex; i > 0; i--) {
            uint256 currentWinnings = userStats[winningsLeaders[i]].totalWinnings;
            uint256 previousWinnings = userStats[winningsLeaders[i-1]].totalWinnings;
            
            if (currentWinnings > previousWinnings) {
                address temp = winningsLeaders[i];
                winningsLeaders[i] = winningsLeaders[i-1];
                winningsLeaders[i-1] = temp;
            } else {
                break;
            }
        }
    }
    
    function _updateAccuracyLeaderboard(address _user) internal {
        UserStats memory stats = userStats[_user];
        
        if (stats.totalPredictions < 5) return;
        
        uint256 userAccuracy = (stats.correctPredictions * BASIS_POINTS) / stats.totalPredictions;
        
        for (uint256 i = 0; i < accuracyLeaders.length; i++) {
            if (accuracyLeaders[i] == _user) {
                _reorderAccuracyLeaderboard(i);
                return;
            }
        }
        
        if (accuracyLeaders.length < 10) {
            accuracyLeaders.push(_user);
            _reorderAccuracyLeaderboard(accuracyLeaders.length - 1);
        } else {
            UserStats memory lowestStats = userStats[accuracyLeaders[9]];
            uint256 lowestAccuracy = (lowestStats.correctPredictions * BASIS_POINTS) / lowestStats.totalPredictions;
            
            if (userAccuracy > lowestAccuracy) {
                accuracyLeaders[9] = _user;
                _reorderAccuracyLeaderboard(9);
            }
        }
        
        emit LeaderboardUpdated(_user, "accuracy");
    }
    
    function _reorderAccuracyLeaderboard(uint256 _startIndex) internal {
        for (uint256 i = _startIndex; i > 0; i--) {
            UserStats memory currentStats = userStats[accuracyLeaders[i]];
            UserStats memory previousStats = userStats[accuracyLeaders[i-1]];
            
            uint256 currentAccuracy = (currentStats.correctPredictions * BASIS_POINTS) / currentStats.totalPredictions;
            uint256 previousAccuracy = (previousStats.correctPredictions * BASIS_POINTS) / previousStats.totalPredictions;
            
            if (currentAccuracy > previousAccuracy) {
                address temp = accuracyLeaders[i];
                accuracyLeaders[i] = accuracyLeaders[i-1];
                accuracyLeaders[i-1] = temp;
            } else {
                break;
            }
        }
    }

    function _updatePointsLeaderboard(address _user) internal {
        uint256 userPoints = userStats[_user].totalPoints;
        
        for (uint256 i = 0; i < pointsLeaders.length; i++) {
            if (pointsLeaders[i] == _user) {
                _reorderPointsLeaderboard(i);
                return;
            }
        }
        
        if (pointsLeaders.length < 10) {
            pointsLeaders.push(_user);
            _reorderPointsLeaderboard(pointsLeaders.length - 1);
        } else {
            uint256 lowestPoints = userStats[pointsLeaders[9]].totalPoints;
            if (userPoints > lowestPoints) {
                pointsLeaders[9] = _user;
                _reorderPointsLeaderboard(9);
            }
        }
        
        emit LeaderboardUpdated(_user, "points");
    }
    
    function _reorderPointsLeaderboard(uint256 _startIndex) internal {
        for (uint256 i = _startIndex; i > 0; i--) {
            uint256 currentPoints = userStats[pointsLeaders[i]].totalPoints;
            uint256 previousPoints = userStats[pointsLeaders[i-1]].totalPoints;
            
            if (currentPoints > previousPoints) {
                address temp = pointsLeaders[i];
                pointsLeaders[i] = pointsLeaders[i-1];
                pointsLeaders[i-1] = temp;
            } else {
                break;
            }
        }
    }
    
    // Create dispute
    function createDispute(uint256 _predictionId, uint256 _proposedWinningOption) external payable {
        Prediction storage prediction = predictions[_predictionId];
        address sender = _msgSender();
        
        require(prediction.resolved, "Prediction not resolved");
        require(msg.value >= disputeStake, "Insufficient stake for dispute");
        require(!hasDispute[_predictionId], "Dispute already exists");
        require(_proposedWinningOption < prediction.options.length, "Invalid option");
        require(_proposedWinningOption != prediction.winningOption, "Must propose different option");
        
        Dispute storage dispute = disputes[_predictionId];
        dispute.predictionId = _predictionId;
        dispute.challenger = sender;
        dispute.proposedWinningOption = _proposedWinningOption;
        dispute.deadline = block.timestamp + disputeVotingPeriod;
        dispute.resolved = false;
        
        hasDispute[_predictionId] = true;
        prediction.active = false;
        
        emit DisputeCreated(_predictionId, sender, _proposedWinningOption, msg.value);
    }
    
    // Vote on dispute
    function voteOnDispute(uint256 _predictionId, bool _voteForCreator) external payable {
        require(hasDispute[_predictionId], "No active dispute");
        Dispute storage dispute = disputes[_predictionId];
        address sender = _msgSender();
        
        require(!dispute.resolved, "Dispute already resolved");
        require(block.timestamp < dispute.deadline, "Voting period ended");
        require(msg.value >= disputeStake, "Insufficient stake for voting");
        require(!dispute.hasVoted[sender], "Already voted");
        
        UserPrediction storage userPred = userPredictions[_predictionId][sender];
        require(userPred.timestamp > 0, "Must have participated to vote");
        
        dispute.hasVoted[sender] = true;
        dispute.totalVotes++;
        
        if (_voteForCreator) {
            dispute.votesForCreator++;
            dispute.votedForCreator[sender] = true;
        } else {
            dispute.votesForChallenger++;
            dispute.votedForCreator[sender] = false;
        }
        
        emit DisputeVote(_predictionId, sender, _voteForCreator, msg.value);
    }

    // Resolve dispute
    function resolveDispute(uint256 _predictionId) external {
        require(hasDispute[_predictionId], "No active dispute");
        Dispute storage dispute = disputes[_predictionId];
        require(block.timestamp >= dispute.deadline, "Voting period not ended");
        require(!dispute.resolved, "Dispute already resolved");
        
        dispute.resolved = true;
        hasDispute[_predictionId] = false;
        
        Prediction storage prediction = predictions[_predictionId];
        bool creatorWon = dispute.votesForCreator > dispute.votesForChallenger;
        
        if (creatorWon) {
            prediction.active = true;
            emit DisputeResolved(_predictionId, true, prediction.winningOption, dispute.totalVotes);
        } else {
            uint256 oldWinningOption = prediction.winningOption;
            prediction.winningOption = dispute.proposedWinningOption;
            
            _redistributePrizesAfterDispute(_predictionId, oldWinningOption, dispute.proposedWinningOption);
            
            emit DisputeResolved(_predictionId, false, dispute.proposedWinningOption, dispute.totalVotes);
        }
        
        _distributeDisputeStakes(_predictionId, creatorWon);
    }
    
    function _redistributePrizesAfterDispute(uint256 _predictionId, uint256 _oldWinningOption, uint256 _newWinningOption) internal {
        address[] memory oldWinners = optionParticipants[_predictionId][_oldWinningOption];
        for (uint256 i = 0; i < oldWinners.length; i++) {
            address oldWinner = oldWinners[i];
            UserPrediction storage userPred = userPredictions[_predictionId][oldWinner];
            if (userPred.claimed) {
                uint256 oldPrize = _calculateUserPrize(_predictionId, oldWinner, _oldWinningOption);
                userPred.claimed = false;
                userStats[oldWinner].totalWinnings -= oldPrize;
                payable(oldWinner).transfer(oldPrize);
            }
        }
        
        _distributePrizes(_predictionId, _newWinningOption);
        predictions[_predictionId].active = true;
    }
    
    function _calculateUserPrize(uint256 _predictionId, address _user, uint256 _option) internal view returns (uint256) {
        Prediction memory prediction = predictions[_predictionId];
        uint256 winnersCount = optionCounts[_predictionId][_option];
        
        if (winnersCount == 0) return 0;
        
        uint256 totalPrize = prediction.prizePool;
        uint256 platformFeeAmount = (totalPrize * platformFee) / BASIS_POINTS;
        uint256 winnersShare = totalPrize - platformFeeAmount;
        uint256 basePrize = winnersShare / winnersCount;
        
        uint256 streakMultiplier = _calculateStreakMultiplier(_user);
        return (basePrize * streakMultiplier) / BASIS_POINTS;
    }
    
    function _distributeDisputeStakes(uint256 _predictionId, bool _creatorWon) internal {
        Dispute storage dispute = disputes[_predictionId];
        
        for (uint256 i = 0; i < optionParticipants[_predictionId][0].length; i++) {
            address participant = optionParticipants[_predictionId][0][i];
            if (dispute.hasVoted[participant]) {
                bool votedForCreator = dispute.votedForCreator[participant];
                
                if ((_creatorWon && votedForCreator) || (!_creatorWon && !votedForCreator)) {
                    payable(participant).transfer(disputeStake * 2);
                }
            }
        }
    }
    
    // Emergency resolve
    function emergencyResolve(uint256 _predictionId, uint256 _winningOption) external {
        require(block.timestamp > predictions[_predictionId].resolutionTime + 7 days, 
                "Use regular resolve function");
        
        Prediction storage prediction = predictions[_predictionId];
        require(!prediction.resolved, "Already resolved");
        
        prediction.resolved = true;
        prediction.winningOption = _winningOption;
        
        _distributePrizes(_predictionId, _winningOption);
        _updateStreaksAfterResolution(_predictionId, _winningOption);
        
        emit PredictionResolved(
            _predictionId, 
            _winningOption, 
            prediction.options[_winningOption],
            optionCounts[_predictionId][_winningOption]
        );
    }
    
    // Platform management
    function setPlatformFee(uint256 _fee) external {
        require(_fee <= 2000, "Fee too high");
        platformFee = _fee;
    }
    
    function setStreakSaverPrice(uint256 _price) external {
        streakSaverPrice = _price;
    }
    
    // View functions
    function getPrediction(uint256 _predictionId) external view returns (
        uint256 id,
        string memory question,
        string[] memory options,
        uint256 entryFee,
        uint256 prizePool,
        uint256 endTime,
        uint256 resolutionTime,
        bool resolved,
        uint256 winningOption,
        bool active,
        address creator,
        uint256 totalParticipants
    ) {
        Prediction memory pred = predictions[_predictionId];
        return (
            pred.id,
            pred.question,
            pred.options,
            pred.entryFee,
            pred.prizePool,
            pred.endTime,
            pred.resolutionTime,
            pred.resolved,
            pred.winningOption,
            pred.active,
            pred.creator,
            pred.totalParticipants
        );
    }
    
    function getUserPrediction(uint256 _predictionId, address _user) 
        external 
        view 
        returns (uint256 option, bool claimed, uint256 timestamp) 
    {
        UserPrediction memory userPred = userPredictions[_predictionId][_user];
        return (userPred.option, userPred.claimed, userPred.timestamp);
    }
    
    function getOptionStats(uint256 _predictionId, uint256 _optionIndex) 
        external 
        view 
        returns (uint256 participantCount, uint256 percentage) 
    {
        uint256 count = optionCounts[_predictionId][_optionIndex];
        uint256 total = predictions[_predictionId].totalParticipants;
        
        if (total == 0) {
            return (0, 0);
        }
        
        uint256 percent = (count * BASIS_POINTS) / total;
        return (count, percent);
    }
    
    function getAllOptionStats(uint256 _predictionId) 
        external 
        view 
        returns (uint256[] memory counts, uint256[] memory percentages) 
    {
        Prediction memory pred = predictions[_predictionId];
        uint256 optionCount = pred.options.length;
        
        counts = new uint256[](optionCount);
        percentages = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            counts[i] = optionCounts[_predictionId][i];
            if (pred.totalParticipants > 0) {
                percentages[i] = (counts[i] * BASIS_POINTS) / pred.totalParticipants;
            }
        }
        
        return (counts, percentages);
    }
    
    function getUserParticipatedPredictions(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userParticipatedPredictions[_user];
    }
    
    function calculatePotentialWinnings(uint256 _predictionId) 
        external 
        view 
        returns (uint256[] memory potentialWinnings) 
    {
        Prediction memory pred = predictions[_predictionId];
        uint256 optionCount = pred.options.length;
        
        potentialWinnings = new uint256[](optionCount);
        uint256 totalPrize = pred.prizePool;
        uint256 platformFeeAmount = (totalPrize * platformFee) / BASIS_POINTS;
        uint256 winnersShare = totalPrize - platformFeeAmount;
        
        for (uint256 i = 0; i < optionCount; i++) {
            uint256 winnersCount = optionCounts[_predictionId][i];
            if (winnersCount > 0) {
                potentialWinnings[i] = winnersShare / winnersCount;
            }
        }
        
        return potentialWinnings;
    }
    
    function getStreakLeaderboard() external view returns (
        address[] memory users,
        uint256[] memory streaks,
        uint256[] memory longestStreaks
    ) {
        uint256 length = streakLeaders.length;
        users = new address[](length);
        streaks = new uint256[](length);
        longestStreaks = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            users[i] = streakLeaders[i];
            streaks[i] = userStats[streakLeaders[i]].currentStreak;
            longestStreaks[i] = userStats[streakLeaders[i]].longestStreak;
        }
        
        return (users, streaks, longestStreaks);
    }
    
    function getWinningsLeaderboard() external view returns (
        address[] memory users,
        uint256[] memory totalWinnings,
        uint256[] memory currentStreaks
    ) {
        uint256 length = winningsLeaders.length;
        users = new address[](length);
        totalWinnings = new uint256[](length);
        currentStreaks = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            users[i] = winningsLeaders[i];
            totalWinnings[i] = userStats[winningsLeaders[i]].totalWinnings;
            currentStreaks[i] = userStats[winningsLeaders[i]].currentStreak;
        }
        
        return (users, totalWinnings, currentStreaks);
    }
    
    function getAccuracyLeaderboard() external view returns (
        address[] memory users,
        uint256[] memory accuracyPercentages,
        uint256[] memory totalPredictions
    ) {
        uint256 length = accuracyLeaders.length;
        users = new address[](length);
        accuracyPercentages = new uint256[](length);
        totalPredictions = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            users[i] = accuracyLeaders[i];
            UserStats memory stats = userStats[accuracyLeaders[i]];
            accuracyPercentages[i] = (stats.correctPredictions * BASIS_POINTS) / stats.totalPredictions;
            totalPredictions[i] = stats.totalPredictions;
        }
        
        return (users, accuracyPercentages, totalPredictions);
    }

    function getPointsLeaderboard() external view returns (
        address[] memory users,
        uint256[] memory totalPoints,
        uint256[] memory currentStreaks
    ) {
        uint256 length = pointsLeaders.length;
        users = new address[](length);
        totalPoints = new uint256[](length);
        currentStreaks = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            users[i] = pointsLeaders[i];
            totalPoints[i] = userStats[pointsLeaders[i]].totalPoints;
            currentStreaks[i] = userStats[pointsLeaders[i]].currentStreak;
        }
        
        return (users, totalPoints, currentStreaks);
    }
    
    function getUserStats(address _user) external view returns (
        uint256 totalPredictions,
        uint256 correctPredictions,
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 totalWinnings,
        uint256 accuracyPercentage,
        bool hasStreakSaver,
        uint256 totalPoints
    ) {
        UserStats memory stats = userStats[_user];
        uint256 accuracy = stats.totalPredictions > 0 ? 
            (stats.correctPredictions * BASIS_POINTS) / stats.totalPredictions : 0;
            
        return (
            stats.totalPredictions,
            stats.correctPredictions,
            stats.currentStreak,
            stats.longestStreak,
            stats.totalWinnings,
            accuracy,
            stats.hasStreakSaver,
            stats.totalPoints
        );
    }
    
    function getStreakMultiplier(address _user) external view returns (uint256) {
        return _calculateStreakMultiplier(_user);
    }
    
    function getUserRank(address _user, string memory _leaderboardType) external view returns (uint256) {
        if (keccak256(bytes(_leaderboardType)) == keccak256(bytes("streak"))) {
            for (uint256 i = 0; i < streakLeaders.length; i++) {
                if (streakLeaders[i] == _user) return i + 1;
            }
        } else if (keccak256(bytes(_leaderboardType)) == keccak256(bytes("winnings"))) {
            for (uint256 i = 0; i < winningsLeaders.length; i++) {
                if (winningsLeaders[i] == _user) return i + 1;
            }
        } else if (keccak256(bytes(_leaderboardType)) == keccak256(bytes("accuracy"))) {
            for (uint256 i = 0; i < accuracyLeaders.length; i++) {
                if (accuracyLeaders[i] == _user) return i + 1;
            }
        } else if (keccak256(bytes(_leaderboardType)) == keccak256(bytes("points"))) {
            for (uint256 i = 0; i < pointsLeaders.length; i++) {
                if (pointsLeaders[i] == _user) return i + 1;
            }
        }
        return 0;
    }
    
    function arePrizesDistributed(uint256 _predictionId) external view returns (bool) {
        Prediction memory prediction = predictions[_predictionId];
        if (!prediction.resolved) return false;
        
        uint256 winningOption = prediction.winningOption;
        address[] memory winners = optionParticipants[_predictionId][winningOption];
        
        for (uint256 i = 0; i < winners.length; i++) {
            UserPrediction storage userPred = userPredictions[_predictionId][winners[i]];
            if (!userPred.claimed) return false;
        }
        return true;
    }
    
    function getUserPrizeStatus(uint256 _predictionId, address _user) external view returns (
        bool hasWon,
        bool prizeClaimed,
        uint256 prizeAmount,
        uint256 streakMultiplier
    ) {
        Prediction memory prediction = predictions[_predictionId];
        UserPrediction storage userPred = userPredictions[_predictionId][_user];
        
        if (!prediction.resolved || userPred.timestamp == 0) {
            return (false, false, 0, 0);
        }
        
        bool isWinner = (userPred.option == prediction.winningOption);
        uint256 multiplier = _calculateStreakMultiplier(_user);
        
        if (isWinner) {
            uint256 winnersCount = optionCounts[_predictionId][prediction.winningOption];
            uint256 totalPrize = prediction.prizePool;
            uint256 platformFeeAmount = (totalPrize * platformFee) / BASIS_POINTS;
            uint256 winnersShare = totalPrize - platformFeeAmount;
            uint256 basePrize = winnersShare / winnersCount;
            uint256 finalPrize = (basePrize * multiplier) / BASIS_POINTS;
            
            return (true, userPred.claimed, finalPrize, multiplier);
        }
        
        return (false, false, 0, 0);
    }

    function getDisputeInfo(uint256 _predictionId) external view returns (
        bool hasActiveDispute,
        address challenger,
        uint256 proposedWinningOption,
        uint256 votesForCreator,
        uint256 votesForChallenger,
        uint256 totalVotes,
        uint256 deadline,
        bool resolved
    ) {
        if (!hasDispute[_predictionId]) {
            return (false, address(0), 0, 0, 0, 0, 0, false);
        }
        
        Dispute storage dispute = disputes[_predictionId];
        return (
            true,
            dispute.challenger,
            dispute.proposedWinningOption,
            dispute.votesForCreator,
            dispute.votesForChallenger,
            dispute.totalVotes,
            dispute.deadline,
            dispute.resolved
        );
    }
    
    function hasUserVotedOnDispute(uint256 _predictionId, address _user) external view returns (
        bool hasVoted,
        bool votedForCreator
    ) {
        if (!hasDispute[_predictionId]) {
            return (false, false);
        }
        
        Dispute storage dispute = disputes[_predictionId];
        return (
            dispute.hasVoted[_user],
            dispute.votedForCreator[_user]
        );
    }
    
    function getDisputeStats(uint256 _predictionId) external view returns (
        uint256 totalParticipants,
        uint256 participantsWhoVoted,
        uint256 votingPercentage
    ) {
        Prediction memory prediction = predictions[_predictionId];
        uint256 total = prediction.totalParticipants;
        
        if (!hasDispute[_predictionId] || total == 0) {
            return (total, 0, 0);
        }
        
        Dispute storage dispute = disputes[_predictionId];
        uint256 voted = dispute.totalVotes;
        uint256 percentage = (voted * BASIS_POINTS) / total;
        
        return (total, voted, percentage);
    }
}