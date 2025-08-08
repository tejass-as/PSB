from base_producer import BaseProducer
import os

class HostEventProducer(BaseProducer):
    def __init__(self):
        super().__init__(
            topic_name='hostevent',
            csv_file_path='/app/dataset/hostevent.csv',
            batch_size=int(os.getenv('BATCH_SIZE', 2)),
            message_sleep_range=(5, 20),
            start_at_line=int(os.getenv('START_AT_LINE', 0))
        )

if __name__ == "__main__":
    HostEventProducer().run()
