package com.office.brewdesk.service;
import com.office.brewdesk.dto.CreateRoundRequest;
import com.office.brewdesk.dto.UpdateRoundRequest;
import com.office.brewdesk.entity.Round;
import com.office.brewdesk.enums.RoundStatus;
import com.office.brewdesk.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;

    public void createTodayRounds() {

        LocalDate today = LocalDate.now();

        createRoundIfNotExists(
                today,
                "Morning",
                LocalTime.of(10, 0),
                LocalTime.of(10, 30)
        );

        createRoundIfNotExists(
                today,
                "Afternoon",
                LocalTime.of(13, 0),
                LocalTime.of(13, 30)
        );
    }

    private void createRoundIfNotExists(
            LocalDate date,
            String name,
            LocalTime startTime,
            LocalTime cutoffTime) {

        if (roundRepository.findByDateAndName(date, name).isEmpty()) {

            Round round = Round.builder()
                    .date(date)
                    .name(name)
                    .startTime(startTime)
                    .cutoffTime(cutoffTime)
                    .status(RoundStatus.UPCOMING)
                    .build();

            roundRepository.save(round);
        }
    }

    public List<Round> getTodayRounds() {

        List<Round> rounds =
                roundRepository.findByDate(LocalDate.now());

        rounds.forEach(this::updateStatus);

        return rounds;
    }

    public Round getRound(Long roundId) {

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() ->
                        new RuntimeException("Round not found"));

        updateStatus(round);

        return round;
    }

    private void updateStatus(Round round) {

        LocalTime now = LocalTime.now();

        RoundStatus newStatus;

        if (now.isBefore(round.getStartTime())) {

            newStatus = RoundStatus.UPCOMING;

        } else if (!now.isAfter(round.getCutoffTime())) {

            newStatus = RoundStatus.OPEN;

        } else {

            newStatus = RoundStatus.CLOSED;
        }

        if (round.getStatus() != newStatus) {

            round.setStatus(newStatus);

            roundRepository.save(round);
        }
    }
    public Round createRound(CreateRoundRequest request) {

        if (roundRepository
                .findByDateAndName(request.getDate(), request.getName())
                .isPresent()) {

            throw new RuntimeException(
                    "Round with this name already exists for this date"
            );
        }

        if (!request.getStartTime().isBefore(request.getCutoffTime())) {

            throw new RuntimeException(
                    "Start time must be before cutoff time"
            );
        }

        Round round = Round.builder()
                .date(request.getDate())
                .name(request.getName())
                .startTime(request.getStartTime())
                .cutoffTime(request.getCutoffTime())
                .status(RoundStatus.UPCOMING)
                .build();

        return roundRepository.save(round);
    }
    public Round updateRound(
            Long id,
            UpdateRoundRequest request) {

        Round round = roundRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Round not found"));

        if (!request.getStartTime()
                .isBefore(request.getCutoffTime())) {

            throw new RuntimeException(
                    "Start time must be before cutoff time"
            );
        }

        round.setName(request.getName());
        round.setStartTime(request.getStartTime());
        round.setCutoffTime(request.getCutoffTime());

        updateStatus(round);

        return roundRepository.save(round);
    }
}