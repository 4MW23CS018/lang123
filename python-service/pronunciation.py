def assess(transcription, expected):
    trans_words = transcription.lower().split()
    expected_words = expected.lower().split()
    correct = sum(1 for w in expected_words if w in trans_words)
    accuracy = round((correct / len(expected_words)) * 100) if expected_words else 0
    missing = [w for w in expected_words if w not in trans_words]
    return accuracy, missing