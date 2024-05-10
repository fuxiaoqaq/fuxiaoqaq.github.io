---
title: Queue Deque
---

:::danger 注意JDK版本
#### 源代码基于JDK17
:::

## ArrayDeque
### 源码分析

```java
/**
 * 1.ArrayDeque 集合内部的主要结构是一个可循环数组，是一个固定大小的数组。
 * 2.head属性，用于标识下一次进行移除操作的数据对象索引位(队列头部的索引位）
 * 3.tail 的属性，主要用于标识下一次进行添加操作的数据对象索引位(队列 尾部的索引位)
 */
public class ArrayDeque<E> extends AbstractCollection<E>
        implements Deque<E>, Cloneable, Serializable {
    
    // 这个数组主要用于存储队列或双端队列中的数据对象
    transient Object[] elements;

    // 该变量指向数组所描述的队列头部(注意transient标识符)
    // 例如，可以通过该变量确定在remove()、pop()等方法中，从队列/双端队列中移除数据对象的索引位
    transient int head;

    // 该变量指向数组所描述的队列尾部的下一个索引位(注意transient标识符)
    // 例如，可以通过该变量确定在addLast(E)、add(E)、push(E)等方法中，
    // 在队列/双端队列中添加数据对象的索引位
    transient int tail;

    //集合的容量上限
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    private void grow(int needed) {
        // overflow-conscious code
        final int oldCapacity = elements.length;
        int newCapacity;
        // Double capacity if small; else grow by 50%
        // 注意:jump 变量的值是扩容增量值
        // 确定扩容策略，如果扩容前的容量值小于64(过小)，则扩容增量值为扩容前的容量值，
        // 否则扩容增量值为扩容前容量值的50%
        int jump = (oldCapacity < 64) ? (oldCapacity + 2) : (oldCapacity >> 1);
        // 注意:真正确认新容量的是"newCapacity = (oldCapacity + jump)" 这句代码
        // 如果条件成立，则说明新扩容的增量值不符合最小扩容增量值的要求，
        // 或者在扩容后，新的容量会大于MAX_ARRAY_SIZE常量的限制，
        // 这时需要使用newCapacity(int, int)方法进行临界值计算
        if (jump < needed
                || (newCapacity = (oldCapacity + jump)) - MAX_ARRAY_SIZE > 0)
            newCapacity = newCapacity(needed, jump);
        final Object[] es = elements = Arrays.copyOf(elements, newCapacity);
        // Exceptionally, here tail == head needs to be disambiguated
        // 这里需要考虑数组复制后的几种特殊情况
        // 例如，循环数组的tail属性和head属性所表示的有效数据范围刚好跨过0号索引位，
        // 或者tail索引位和head索引位交汇
        // 在这些情况下，需要重新修正扩容操作后新的循环数组中的数据对象存储状况
        if (tail < head || (tail == head && es[head] != null)) {
            // wrap around; slide first leg forward to end of array
            // 计算得到新容量值和旧容量值的差值
            int newSpace = newCapacity - oldCapacity;
            // 将当前head索引位之后的数据对象复制到从head + newSpace开始的索引位上
            System.arraycopy(es, head,
                    es, head + newSpace,
                    oldCapacity - head);
            // 从当前head索引位开始，向后一边清理错误位置上的数据对象，一边重新定位head索引位，直到正确为止
            for (int i = head, to = (head += newSpace); i < to; i++)
                es[i] = null;
        }
    }

    private int newCapacity(int needed, int jump) {
        final int oldCapacity = elements.length, minCapacity;
        if ((minCapacity = oldCapacity + needed) - MAX_ARRAY_SIZE > 0) {
            if (minCapacity < 0)
                throw new IllegalStateException("Sorry, deque too big");
            return Integer.MAX_VALUE;
        }
        if (needed > jump)
            return minCapacity;
        return (oldCapacity + jump - MAX_ARRAY_SIZE < 0)
                ? oldCapacity + jump
                : MAX_ARRAY_SIZE;
    }
    // 该构造方法是默认的构造方法，主要用于初始化一个长度为16 + 1的数组
    public ArrayDeque() {
        elements = new Object[16 + 1];
    }
    // 设置ArrayDeque集合的初始化容量，如果容量值小于1，则初始化一个容量值为1的数组
    public ArrayDeque(int numElements) {
        elements =
                new Object[(numElements < 1) ? 1 :
                        (numElements == Integer.MAX_VALUE) ? Integer.MAX_VALUE :
                                numElements + 1];
    }

    public ArrayDeque(Collection<? extends E> c) {
        this(c.size());
        copyElements(c);
    }

    static final int inc(int i, int modulus) {
        if (++i >= modulus) i = 0;
        return i;
    }

    static final int dec(int i, int modulus) {
        if (--i < 0) i = modulus - 1;
        return i;
    }

    public void addFirst(E e) {
        if (e == null)
            throw new NullPointerException();
        final Object[] es = elements;
        //获取上一个索引位置，并赋值
        es[head = dec(head, es.length)] = e;
        if (head == tail)
            grow(1);
    }

    public void addLast(E e) {
        if (e == null)
            throw new NullPointerException();
        final Object[] es = elements;
        es[tail] = e;
        if (head == (tail = inc(tail, es.length)))
            grow(1);
    }
}
```
### 版本差异
:::tip
#### jdk8
- 初始化默认的是一个16的数组
- 有参初始化最小为8,数组容量满足2的幂数
#### jdk8+(jdk17)
- 初始化默认的是一个17的数组
- 有参初始化如果小于1,初始化一个为1的数组,如果大于1,初始化一个numElements+1的数组
#### jdk8+总结
- +1的原因是:在循环数组中增加一个空置索引位，用于标识在完成数据对象添加操作 后是否需要进行扩容操作
- 对扩容过程也进行了调整，使数组的容量值不需要严格 满足 2 的幂数
:::
### 初始化以及扩容总结
:::warning
#### 扩容
- 如果扩容前数组大小小于64， 则按照扩容到原数组的2倍。如果扩容前数组大小大于64，则扩容到原数组的1.5倍。需要注意的是数组容量上限为Integer.MAX - 8。
#### 数据校正
- 执行扩容后，使用System.arraycopy基于head索引位进行数据校正。
- 计算扩容前后的数组长度差值，例如 扩容前为17 扩容后为34 差值为17。
- 复制当前的head的位置 例如当前head位置是2 复制后的数据目标位置为 2+17 = 19。
- 复制当前head 索引2 位置以及以后的数据到 索引10 位置以及以后。
- 旧索引位置复制到新索引位置成功后，清理掉原始错误索引位置上的数据对象为null等待垃圾回收，完成扩容。
:::
## PriorityQueue
### 源码分析
```java
public class PriorityQueue<E> extends AbstractQueue<E>
        implements java.io.Serializable {
    //该常量主要用于设置queue数组默认的容量
    private static final int DEFAULT_INITIAL_CAPACITY = 11;

    // 这个数组变量是一个完全二叉树的降维表达，其中的数据对象满足以下要求:  
    // the two children of queue[n] are queue[2*n+1] and queue[2*(n+1)]  
    transient Object[] queue; // non-private to simplify nested class access  

    int size;

    private final Comparator<? super E> comparator;
    // modCount变量表示当前PriorityQueqe队列从完成初始化到目前为止，其数据对象被修改的次数， 
    // 即进行数据写入操作的次数，这主要借鉴了CAS思想，即在非线程安全的场景中实现简单的数据安全判定  
    transient int modCount;     // non-private to simplify nested class access  

    public PriorityQueue() {
        this(DEFAULT_INITIAL_CAPACITY, null);
    }

    public PriorityQueue(int initialCapacity) {
        this(initialCapacity, null);
    }

    public PriorityQueue(Comparator<? super E> comparator) {
        this(DEFAULT_INITIAL_CAPACITY, comparator);
    }

    public PriorityQueue(int initialCapacity,
                         Comparator<? super E> comparator) {
        // Note: This restriction of at least one is not actually needed,  
        // but continues for 1.5 compatibility    if (initialCapacity < 1)  
        throw new IllegalArgumentException();
        this.queue = new Object[initialCapacity];
        this.comparator = comparator;
    }

    public PriorityQueue(Collection<? extends E> c) {
        if (c instanceof SortedSet<?>) {
            SortedSet<? extends E> ss = (SortedSet<? extends E>) c;
            this.comparator = (Comparator<? super E>) ss.comparator();
            initElementsFromCollection(ss);
        }
        else if (c instanceof PriorityQueue<?>) {
            PriorityQueue<? extends E> pq = (PriorityQueue<? extends E>) c;
            this.comparator = (Comparator<? super E>) pq.comparator();
            initFromPriorityQueue(pq);
        }
        else {
            this.comparator = null;
            initFromCollection(c);
        }
    }

    public PriorityQueue(PriorityQueue<? extends E> c) {
        this.comparator = (Comparator<? super E>) c.comparator();
        initFromPriorityQueue(c);
    }

    public PriorityQueue(SortedSet<? extends E> c) {
        this.comparator = (Comparator<? super E>) c.comparator();
        initElementsFromCollection(c);
    }

    private void grow(int minCapacity) {
        int oldCapacity = queue.length;
        // Double size if small; else grow by 50%  
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                oldCapacity < 64 ? oldCapacity + 2 : oldCapacity >> 1
                /* preferred growth */);
        queue = Arrays.copyOf(queue, newCapacity);
    }
}
```
### 初始化以及扩容总结
:::warning
- 默认构造器初始化为11，无参构造器不能小于1。
- 如果扩容前数组大小小于64 则按照扩容到原数组的2倍，如果扩容前数组大小大于64，则扩容到原数组的1.5倍。
- 默认为自然排序的小顶堆,通过指定一个逆序的Comparator，可以将其转换为大顶堆。
:::

## ArrayBlockingQueue <Badge text="JUC并发集合"/>
### 总结
- 内部基于循环数组的，可以在高并发场景中使用的阻塞队列，也是一种容量有界的队列。该队列符合先进先出(FIFO)的工作原则。
- 支持公平和非公平两种模式,不支持动态扩容
  ```java
  public ArrayBlockingQueue(int capacity, boolean fair) {
        if (capacity <= 0)
            throw new IllegalArgumentException();
        this.items = new Object[capacity];
        lock = new ReentrantLock(fair);
        notEmpty = lock.newCondition();
        notFull =  lock.newCondition();
  }
  ```
- 基于ReentrantLock锁机制,以及lock.newCondition() 用于实现线程之间的协调和通信
- ArrayBlockingQueue 队列主要依靠基于 AQS 的悲观锁进行工作，为了避免竞争，其读/写操作都采用同一把锁进行控制，也就是说， 读/写操作都需要互相等待

## LinkedBlockingQueue <Badge text="JUC并发集合"/>
### 总结
- 内部基于单向链表,可以根据参数指定分为有界队列和无界队列
- LinkedBlockingQueue 队列中有两个可重入锁(putLock 属性和 takeLock 属性)，分别用于控制数据对象添加过程和数据对象移除过程在并发场景中的正确性，
  **LinkedBlockingQueue 队列的数据对象添加过程和数据对象移除过程是不冲突的**
- 不支持非公平模式
- 基于ReentrantLock锁机制,以及lock.newCondition() 用于实现线程之间的协调和通信

## LinkedBlockingDeque <Badge text="JUC并发集合"/>
### 总结
- 内部基于双向链表链表,可以根据参数指定分为有界队列和无界队列
- 与LinkedBlockingQueue类似,区别在于LinkedBlockingDeque头部尾部都支持插入,移除等操作
- 不支持非公平模式
- 基于ReentrantLock锁机制,以及lock.newCondition() 用于实现线程之间的协调和通信

## SynchronousQueue <Badge text="JUC并发集合"/>
### 源码分析
```java
public SynchronousQueue(boolean fair) {
        transferer = fair ? new TransferQueue<E>() : new TransferStack<E>();
}
```
### 总结
- SynchronousQueue 是一种特立独行的队列，其本身是没有容量的，比如调用者放一个数据到队列中，调用者是不能够立马返回的，调用者必须等待别人把我放进去的数据消费掉了，才能够返回。
- SynchronousQueue 基于无锁CAS思想实现
- 支持两种数据结构 TransferQueue 队列和 TransferStack 栈结构,TransferStack是非公平的

## LinkedTransferQueue <Badge text="JUC并发集合"/>
### 总结
- 不基于ReentrantLock锁机制,而是CAS思想
- 无界队列
- 不支持非公平模式
- 和之前利用 ArrayBlockingQueue 队列、LinkedBlockingQueue 队列实现的生产者线程/消费者线程进行比较，
  最典型的特点是生产者线程可以采用transfer()方法将数据对象添加到LinkedTransferQueue队列中，
  如果这个数据对象暂时没有消费者线程将其取出处理，则当前生成者线程会进入阻塞状态。
  而基于 LinkedTransferQueue 队列工作的消费者线程也可以使用类似的方法(如take()方法)试图从队列中取出数据对象，如果没有数据对象可以取出，则消费者进入阻塞状态

## PriorityBlockingQueue <Badge text="JUC并发集合"/>
### 总结
- 默认初始化大小11
- 基于小顶堆,无界队列(最大Integer.MAX_VALUE - 8 相当于无界)
- 不支持非公平模式
- 基于ReentrantLock锁机制,以及lock.newCondition() 用于实现线程之间的协调和通信
### 扩容
:::warning
- 默认构造器初始化为11，无参构造器不能小于1。
- 如果扩容前数组大小小于64 则按照扩容到原数组的2倍，如果扩容前数组大小大于64，则扩容到原数组的1.5倍。
- PriorityBlockingQueue 队列改用保证原子性的控制来保证同一时 间只有一个扩容请求得到实际操作，其他扩容操作请求保持自旋，直到扩容操作结束
:::
## DelayQueue <Badge text="JUC并发集合"/>
### 说明
- 主要应用于有延迟处理需求的场景中。例如，根据业务逻辑需要暂停当前的业务处理过程，让处理过程在10分钟后继续执行，但是不能一直占用一个工作线程 (因为工作线程是有限的);在这种情况下，可以将当前处理过程的业务数据描述成一个对
  象并将其放入DelayQueue队列，然后将工作线程交还业务线程池(以便处理另一个业务); 在到达延迟等待时间后，由DelayQueue队列的消费者线程将其重新放入业务线程池继续执行。
- DelayQueue队列的数据对象，必须实现Delayed接口，这个接口主要规定了进入DelayQueue队列的数据对象需要有怎样的阻塞等待逻辑
### 总结
- DelayQueue队列内部使用PriorityQueue队列作为真实的数据对象存储结构
- 不支持非公平模式
- 基于ReentrantLock锁机制,以及lock.newCondition() 用于实现线程之间的协调和通信

## ConcurrentLinkedQueue <Badge text="JUC并发集合"/>
### 说明
- ConcurrentLinkedQueue是一个线程安全的队列，它的特点是非阻塞，也就是说当队列为空时，出队操作不会阻塞线程，而是立即返回null。同时，它也不允许插入null元素。
- ConcurrentLinkedQueue是一个基于链接节点的无界线程安全队列。它采用了先进先出的原则，对于并发访问，它采取了一种无锁算法（lock-free），实现了高效率的并发操作。它通过CAS操作实现了“原子操作”，保证了线程安全
### 总结
- 基于单向链表的无界非阻塞高并发队列
- ConcurrentLinkedQueue的应用场景很广泛，它可以作为多线程环境下的任务队列，也可以作为消息队列、日志队列等
- 支持先进先出原则，采用无锁算法实现高效的并发操作
- 不支持随机访问和元素排序

## ConcurrentLinkedDeque <Badge text="JUC并发集合"/>
### 说明
- ConcurrentLinkedDeque类提供了线程安全的双端队列操作，支持高效的并发访问，因此在多线程环境下，可以放心地在队列的两端添加或移除元素，而不用担心数据的一致性问题。同时，它的内部实现采用了无锁算法，从而避免了传统锁带来的性能开销。
- 可以将每个聊天室看作是一个ConcurrentLinkedDeque实例，其中的每个元素都是一条消息，由于ConcurrentLinkedDeque是线程安全的，这意味着多个线程可以同时向同一个聊天室添加或删除消息，而不会导致数据混乱或不一致。
- 当用户发送一条消息时，可以将这条消息添加到相应聊天室的ConcurrentLinkedDeque的尾部，而当用户查看聊天室的消息历史时，可以从ConcurrentLinkedDeque的头部开始遍历并显示消息，由于ConcurrentLinkedDeque支持在两端进行高效的操作，因此这种使用场景非常合适。ConcurrentLinkedDeque还提供了更加安全的并发操作方法，如offerFirst、offerLast、pollFirst和pollLast等，这些方法可以在多线程环境下安全地添加和删除元素。
### 总结
- 基于双向链表的无界非阻塞高并发队列
- ConcurrentLinkedDeque通过无锁（lock-free）或者最小化锁竞争的设计，提供了更高的吞吐量，基于CAS思想，从而减少了线程间的竞争和阻塞